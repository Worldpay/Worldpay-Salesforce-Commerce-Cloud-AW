'use strict';
var PaymentMgr = require('dw/order/PaymentMgr');
var Transaction = require('dw/system/Transaction');
var ServiceFacade = require('*/cartridge/scripts/service/serviceFacade');

/**
* This Method identifies the matched payment instrument against the service response token url.
* @param {dw.order.PaymentInstrument} customerPaymentInstruments customer payment instrument list.
* @param {Object} serviceResponse - verify token response.
* @return {dw.order.PaymentInstrument} the matched payment instrument if found
*/
function getTokenPaymentInstrument(customerPaymentInstruments, serviceResponse) {
    if (customerPaymentInstruments && serviceResponse && serviceResponse.tokenUrl) {
        var instrumentsIter = customerPaymentInstruments.iterator();
        while (instrumentsIter.hasNext()) {
            var creditCardInstrument = instrumentsIter.next();
            if (!creditCardInstrument.creditCardNumber) {
                continue;
            }
            if (creditCardInstrument.custom.awpCCTokenData === serviceResponse.tokenUrl) {
                return creditCardInstrument;
            }
        }
    }
    return;
}

/**
*  Copy payment card to instruments
* @param {dw.order.PaymentInstrument} paymentInstr - customer payment instrument list.
* @param {string} ccNumber -  cardNumber.
* @param {string} ccType -  cardType.
* @param {string} ccExpiryMonth -  expirationMonth.
* @param {string} ccExpiryYear -  expirationYear.
* @param {string} ccHolder -  ccHolder.
* @param {string} ccToken -  ccToken.
* @param {string} tokenPaymentInstrument -  token href for credit card
* @param {string} tokenExpiryDateTime -  token expiry date and time
* @return {dw.order.PaymentInstrument} payment Instruments
*/
function copyPaymentCardToInstrument(paymentInstr, ccNumber, ccType, ccExpiryMonth, ccExpiryYear, ccHolder, ccToken, tokenPaymentInstrument, tokenExpiryDateTime) {
    var PaymentInstrument = require('dw/order/PaymentInstrument');
    var creditCardNumber = ccNumber;
    var creditCardExpirationMonth = ccExpiryMonth;
    var creditCardExpirationYear = ccExpiryYear;
    var creditCardType = ccType;
    var creditCardHolder = ccHolder;

    if (paymentInstr == null) {
        return null;
    }

    if (!PaymentInstrument.METHOD_CREDIT_CARD.equals(paymentInstr.paymentMethod)) {
        return null;
    }

    Transaction.wrap(function () {
        // copy the credit card details to the payment instrument
        if (!paymentInstr.getCreditCardHolder() && creditCardHolder) {
            paymentInstr.setCreditCardHolder(creditCardHolder);
        }
        if (!paymentInstr.getCreditCardNumber() && creditCardNumber) {
            paymentInstr.setCreditCardNumber(creditCardNumber);
        }
        if (!paymentInstr.getCreditCardExpirationMonth() && creditCardExpirationMonth) {
            paymentInstr.setCreditCardExpirationMonth(typeof (creditCardExpirationMonth) === 'object' ? creditCardExpirationMonth.valueOf() : creditCardExpirationMonth);
        }
        if (!paymentInstr.getCreditCardExpirationYear() && creditCardExpirationYear) {
            paymentInstr.setCreditCardExpirationYear(typeof (creditCardExpirationYear) === 'object' ? creditCardExpirationYear.valueOf() : creditCardExpirationYear);
        }
        if (!paymentInstr.getCreditCardType() && creditCardType) {
             paymentInstr.setCreditCardType(creditCardType);
        }
        if (!empty(tokenPaymentInstrument)) {
            paymentInstr.custom.awpCCTokenExpiry = parseExpiryDate(tokenExpiryDateTime);
            paymentInstr.custom.awpCCTokenData = tokenPaymentInstrument;
            paymentInstr.setCreditCardToken(ccToken);
        }else{
            //assigning an expired token so that a new call can be made in the subsequent payment
            paymentInstr.custom.awpCCTokenData = 'expired token';
            paymentInstr.custom.awpCCTokenExpiry = new Date();
        }

    });
    return paymentInstr;
}


/**
 * Helper function for converting token expiry date time to Date object
 * @param {string} tokenExpiryDateTime -  token expiry date and time.
 * @return {Date} date - Date object for the expiry date-time
*/
function parseExpiryDate(tokenExpiryDateTime){
    var expiryDate = tokenExpiryDateTime.split('T')[0];
    var expiryTime = tokenExpiryDateTime.split('T')[1].replace('Z', '');
    var date = new Date(Number(expiryDate.split('-')[0]),
                        Number(expiryDate.split('-')[1])-1,
                        Number(expiryDate.split('-')[2]));
    var expiryHour = Number(expiryTime.split(':')[0]);
    var expiryMinute = Number(expiryTime.split(':')[1]);
    var expirySecond = Number(expiryTime.split(':')[2]);
    date.setHours(expiryHour);
    date.setMinutes(expiryMinute);
    date.setSeconds(expirySecond);
    return date;
}



/**
 * Hook function to update token details in Payment Instrument.
 * @param {string} responseData -  responseData.
 * @param {dw.order.PaymentInstrument} paymentInstrument - payment instrument object
*/
function updatePaymentInstrumentToken(responseData, paymentInstrument) {
    var serviceResponse = responseData.serviceresponse;
    if (serviceResponse != null && paymentInstrument != null && serviceResponse.tokenPaymentInstrument != null) {
        paymentInstrument.custom.awpCCTokenExpiry = parseExpiryDate(serviceResponse.tokenExpiryDateTime);
        paymentInstrument.custom.awpCCTokenData = serviceResponse.tokenPaymentInstrument;
    }
}

/**
 * remove existing payment instrument
 * @param {string} cart - cart
 */
function removeExistingPaymentInstruments(cart) {
    var WorldpayConstants = require('*/cartridge/scripts/common/worldpayConstants');
    if (cart != null) {
        var ccPaymentInstrs = cart.getPaymentInstruments();
        if (ccPaymentInstrs && ccPaymentInstrs.length > 0) {
            var iter = ccPaymentInstrs.iterator();
            var existingPI = null;
            while (iter.hasNext()) {
                existingPI = iter.next();
                if (existingPI.paymentMethod != null && PaymentMgr.getPaymentMethod(existingPI.paymentMethod).paymentProcessor.ID.equalsIgnoreCase(WorldpayConstants.WORLDPAY)) {
                    cart.removePaymentInstrument(existingPI);
                }
            }
        }
    }
}

function validateTokenServiceResponse (CCTokenRequestResult, paymentInstrument) {
    // we would rollback the save card transaction if this merthod returns false
    var result = {
        success : '',
        solvedConflicts : '',
        solvedConflictsCount : '',
        servererror : '',
        updateLimitCrossed : '',
        verfied : ''
    };

    if (CCTokenRequestResult && CCTokenRequestResult.serviceResponse && CCTokenRequestResult.serviceResponse.outcome) {
            if (CCTokenRequestResult.serviceResponse.outcome === 'not verified') {
                result.success = false;
                result.verfied = false;
                return result;
            }
            if (CCTokenRequestResult.serviceResponse.outcome === 'verified' && CCTokenRequestResult.serviceResponse.tokenConflictUrl) {
                var tokenConflictURL = CCTokenRequestResult.serviceResponse.tokenConflictUrl;
                var conflicts = findConflicts (tokenConflictURL);
                if (conflicts.length > 0) {
                    var updateResult = updateTokenConflicts(conflicts, paymentInstrument, tokenConflictURL);
                    if(updateResult.length > 0) {
                        result.success = true;
                        result.solvedConflicts = updateResult;
                        result.solvedConflictsCount = updateResult.length;
                    } else {
                        result.success=false;
                        result.updateLimitCrossed = true;
                   }
                }
            } else {
                result.success = true;  // no problems
            }
    } else {
        result.success = false;
        result.servererror = true;
    }
    return result;
}


function findConflicts(tokenConflictURL) {
    var conflicts = [];
    if (tokenConflictURL) {
        var conflictedToken = ServiceFacade.enquireToken(tokenConflictURL);
        var tokenResponse = (conflictedToken && conflictedToken.serviceresponse) ? conflictedToken.serviceresponse : '';
        if (tokenResponse) {
            if (tokenResponse.tokenConflictExpDate && tokenResponse.tokenConflictName) {
                conflicts.push({
                    'conflict' : 'expDate',
                    'expDate' : tokenResponse.tokenConflictExpDate,
                    'expDateURL' : tokenResponse.tokenExpdateURL // TO-DO check tokenExpdateURL existence
                });
                conflicts.push({
                    'conflict' : 'cardHolder',
                    'cardHolder' : tokenResponse.tokenConflictName,
                    'cardHolderURL' : tokenResponse.tokenCcHolderNameURL // TO-DO check tokenExpdateURL existence
                });
            } else if (tokenResponse.tokenConflictExpDate) {
                conflicts.push({
                    'conflict' : 'expDate',
                    'expDate' : tokenResponse.tokenConflictExpDate,
                    'expDateURL' : tokenResponse.tokenExpdateURL // TO-DO check tokenExpdateURL existence
                });
            } else if (tokenResponse.tokenConflictName){
                conflicts.push({
                    'conflict' : 'cardHolder',
                    'cardHolder' : tokenResponse.tokenConflictName,
                    'cardHolderURL' : tokenResponse.tokenCcHolderNameURL // TO-DO check tokenExpdateURL existence
                });
            }
        }
    }
    return conflicts;
}

/**
 * Makes the service call to resolve the conflicts and returns all conflicts that were resolved as an array
 * @param {Object} conflictsList - Contains all conflicts in an array
 * @param {Object} paymentInstrument - Contains current payment instrument object
 * @param {String} tokenConflictURL - Contains conflict URL
 * @returns all conflicts that were resolved
 */
function updateTokenConflicts (conflictsList, paymentInstrument, tokenConflictURL) {
    // expiry or cardHolderName
    var Logger = require('dw/system/Logger');
    var conflictResolutionResponse; var updatedConflicts = [];
    if (conflictsList && conflictsList.length > 0) {
        Logger.getLogger('worldpay').debug('Update token service triggered for cardHolderName and cardExpiryDate update');
        conflictResolutionResponse = ServiceFacade.updateTokenDetails(tokenConflictURL);
        if (conflictResolutionResponse.success) {
            updatedConflicts = conflictsList;
            Transaction.wrap(function () {
                paymentInstrument.custom.nameTokenConflictResolved = 'true';
                paymentInstrument.custom.dateTokenConflictResolved = 'true';
            });
        } else {
            return updatedConflicts;
        }
    }
    return updatedConflicts;
}

function updateTokenConflictsWCsdk(conflictsList, tokenConflictURL) {
    // expiry or cardHolder
    var Logger = require('dw/system/Logger');
    var conflictResolutionResponse; var updatedConflicts = [];
    if (conflictsList && conflictsList.length > 0) {
        Logger.getLogger('worldpay').debug('Update token service triggered for cardHolderName update');
        conflictResolutionResponse = ServiceFacade.updateTokenDetails(tokenConflictURL);
        if (conflictResolutionResponse.success) {
            updatedConflicts = conflictsList;
        } else {
            return updatedConflicts;
        }
    }
    return updatedConflicts;
}

/** Exported functions **/
module.exports = {
    updatePaymentInstrumentToken: updatePaymentInstrumentToken,
    removeExistingPaymentInstruments: removeExistingPaymentInstruments,
    copyPaymentCardToInstrument: copyPaymentCardToInstrument,
    getTokenPaymentInstrument: getTokenPaymentInstrument,
    validateTokenServiceResponse: validateTokenServiceResponse,
    findConflicts: findConflicts,
    updateTokenConflictsWCsdk: updateTokenConflictsWCsdk
};
