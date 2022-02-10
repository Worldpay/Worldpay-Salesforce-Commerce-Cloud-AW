'use strict';
var Site = require('dw/system/Site');
var server = require('server');

/**
 * Update Token details in customer payment cards
 * @param {Object} responseData token service response object
 * @param {dw.customer.Customer} customerObj -  The customer object
 * @param {dw.order.PaymentInstrument} paymentInstrument -  The payment instrument
 * @return {Object} returns an json object
 */
function addOrUpdateToken(responseData, customerObj, paymentInstrument) {
    var PaymentInstrument = require('dw/order/PaymentInstrument');
    var Transaction = require('dw/system/Transaction');
    var paymentInstrumentUtils = require('*/cartridge/scripts/common/paymentInstrumentUtils');
    if (customerObj) {
        var wallet = customerObj.getProfile().getWallet();
        var paymentInstruments = wallet.getPaymentInstruments(PaymentInstrument.METHOD_CREDIT_CARD);
        var matchedPaymentInstrument = paymentInstrumentUtils.getTokenPaymentInstrument(paymentInstruments, responseData);
        var tokenId;
        var tokenPaymentInstrument;
        var tokenExpiryDateTime;
        var newPaymentInstrument;
        if (!matchedPaymentInstrument) {
            tokenId = (responseData) ? responseData.tokenId.valueOf().toString() : null;
            tokenPaymentInstrument = (responseData) ? responseData.tokenPaymentInstrument : null;
            tokenExpiryDateTime = (responseData) ? responseData.tokenExpiryDateTime : null;
            Transaction.begin();
            newPaymentInstrument = wallet.createPaymentInstrument(PaymentInstrument.METHOD_CREDIT_CARD);
            newPaymentInstrument = paymentInstrumentUtils.copyPaymentCardToInstrument(newPaymentInstrument, paymentInstrument.creditCardNumber,
                paymentInstrument.creditCardType, Number(paymentInstrument.creditCardExpirationMonth), Number(paymentInstrument.creditCardExpirationYear),
                paymentInstrument.creditCardHolder, tokenId, tokenPaymentInstrument, tokenExpiryDateTime);
            if (!(newPaymentInstrument && newPaymentInstrument.getCreditCardNumber() && newPaymentInstrument.getCreditCardExpirationMonth() &&
                newPaymentInstrument.getCreditCardExpirationYear() && newPaymentInstrument.getCreditCardType() &&
                newPaymentInstrument.getCreditCardHolder())) {
                Transaction.rollback();
            }
            Transaction.commit();
        } else if (matchedPaymentInstrument && paymentInstrument.custom.updateTokenResult === 'true') {
            Transaction.wrap(function () {
                wallet.removePaymentInstrument(matchedPaymentInstrument);
            });
            tokenId = (responseData) ? responseData.tokenId.valueOf().toString() : null;
            tokenPaymentInstrument = (responseData) ? responseData.tokenPaymentInstrument : null;
            tokenExpiryDateTime = (responseData) ? responseData.tokenExpiryDateTime : null;
            Transaction.begin();
            newPaymentInstrument = wallet.createPaymentInstrument(PaymentInstrument.METHOD_CREDIT_CARD);
            newPaymentInstrument = paymentInstrumentUtils.copyPaymentCardToInstrument(newPaymentInstrument, paymentInstrument.creditCardNumber,
                   paymentInstrument.creditCardType, Number(paymentInstrument.creditCardExpirationMonth), Number(paymentInstrument.creditCardExpirationYear),
                   paymentInstrument.creditCardHolder, tokenId, tokenPaymentInstrument, tokenExpiryDateTime);
            if (!(newPaymentInstrument && newPaymentInstrument.getCreditCardNumber() && newPaymentInstrument.getCreditCardExpirationMonth() &&
                   newPaymentInstrument.getCreditCardExpirationYear() && newPaymentInstrument.getCreditCardType() &&
                   newPaymentInstrument.getCreditCardHolder())) {
                Transaction.rollback();
            }
            Transaction.commit();
        } else if (matchedPaymentInstrument && paymentInstrument.custom.updateTokenResult === 'false') {
            return {
                success: true,
                hasUpdateLimitReached: 'yes',
                canSavecard: 'false'
            };
        } else {
            return {
                success: true,
                hasUpdateLimitReached: 'no',
                canSavecard: 'true'
            };
        }
    }
    return {
        success: true
    };
}

/**
 *  Function to check for payment response and copy token data to customer payment instrument
 * @param {Object} serviceResponse - payment authorization response
 * @param {dw.order.PaymentInstrument} paymentInstrument - order payment instrument
 * @param {dw.customer.Customer} customerObj - customer object
 * @param {Object} CCTokenRequestResult - token service response
 * @param {saveCardInConflict} saveCardInConflict - Save card with conflict
 * @param {preferences} preferences - find 3ds type
 * @returns {Object} returns a JSON object
 */
function checkAuthorizationAWP(serviceResponse, paymentInstrument, customerObj, CCTokenRequestResult, saveCardInConflict, preferences) {
    var utils = require('*/cartridge/scripts/common/utils');
    var cardAddResult = null;
    var canSavecard = null;
    var hasUpdateLimitReached = '';
    var EnableTokenizationPref = Site.getCurrent().getCustomPreferenceValue('AWPEnableCCTokenization');
    var WorldpayConstants = require('*/cartridge/scripts/common/worldpayConstants');
    var responseContent = serviceResponse.content;
    var outcome = responseContent.outcome;
    var tokenServiceResponse = (!empty(CCTokenRequestResult) && !CCTokenRequestResult.error) ? CCTokenRequestResult.serviceresponse : null;
    var paymentForm = server.forms.getForm('billing');
    if (session.privacy.hasUpdateLimitReached) {
        delete session.privacy.hasUpdateLimitReached;
    }
    if (session.privacy.saveCardInConflict) {
        delete session.privacy.saveCardInConflict;
    }
    if (session.privacy.saveCardCheckBoxValue) {
        delete session.privacy.saveCardCheckBoxValue;
    }
    if ((outcome.equalsIgnoreCase(WorldpayConstants.AUTHORIZED) && tokenServiceResponse !== null)
        || ((outcome.equalsIgnoreCase(WorldpayConstants.AUTHORIZED)) && paymentInstrument.custom.wpTokenRequested)) {
        if (EnableTokenizationPref && customerObj != null && customerObj.authenticated) {
            cardAddResult = addOrUpdateToken(tokenServiceResponse, customerObj, paymentInstrument);
        }
        if (cardAddResult && cardAddResult.canSavecard === 'false') {
            canSavecard = cardAddResult.canSavecard;
        }
        if (cardAddResult && cardAddResult.hasUpdateLimitReached === 'yes') {
            hasUpdateLimitReached = cardAddResult.hasUpdateLimitReached;
            session.privacy.hasUpdateLimitReached = hasUpdateLimitReached;
        }
        if (preferences.threeDSType.value.equals('disabled') && saveCardInConflict) {
            session.privacy.saveCardInConflict = saveCardInConflict;
        }
        if (paymentForm.creditCardFields) {
            session.privacy.saveCardCheckBoxValue = paymentForm.creditCardFields.saveCard.checked;
        }
        return {
            authorized: true,
            echoData: '',
            canSavecard: canSavecard,
            hasUpdateLimitReached: hasUpdateLimitReached,
            saveCardInConflict: saveCardInConflict
        };
    } else if (outcome.equalsIgnoreCase(WorldpayConstants.AUTHORIZED)) {
        return {
            authorized: true,
            echoData: ''
        };
    } else if (!empty(serviceResponse.errorName)) {
        return {
            error: true,
            errorMessage: utils.getConfiguredLabel('worldpay.error.codecancelled', 'worldpayError')
        };
    }
    return {
        error: true,
        errorkey: 'worldpay.error.code' + serviceResponse.errorCode,
        errorMessage: utils.getErrorMessage(serviceResponse.errorCode)
    };
}

/**
 * Update Token details in customer payment cards
 * @param {Object} responseData service response object
 * @param {dw.customer.Customer} customerObj -  The customer object
 * @param {dw.order.PaymentInstrument} paymentInstrument -  The payment instrument
 * @return {Object} returns an json object
 */
function addOrUpdateTokenforwebcsdk(responseData, customerObj, paymentInstrument) {
    var PaymentInstrument = require('dw/order/PaymentInstrument');
    var Transaction = require('dw/system/Transaction');
    var paymentInstrumentUtils = require('*/cartridge/scripts/common/paymentInstrumentUtils');
    if (customerObj) {
        var wallet = customerObj.getProfile().getWallet();
        var paymentInstruments = wallet.getPaymentInstruments(PaymentInstrument.METHOD_CREDIT_CARD);
        var tokenUrl = {
            tokenUrl: session.privacy.verfiedToken ? session.privacy.verfiedToken : paymentInstrument.custom.awpCCTokenData
        };
        var matchedPaymentInstrument = paymentInstrumentUtils.getTokenPaymentInstrument(paymentInstruments, tokenUrl);
        var tokenId;
        var tokenPaymentInstrument;
        var tokenExpiryDateTime;
        var newPaymentInstrument;
        if (matchedPaymentInstrument == null) {
            tokenId = paymentInstrument.custom.csdkTokenId;
            tokenPaymentInstrument = paymentInstrument.custom.csdkTokenPi;
            tokenExpiryDateTime = paymentInstrument.custom.csdkTokenExp;
            Transaction.begin();
            newPaymentInstrument = wallet.createPaymentInstrument(PaymentInstrument.METHOD_CREDIT_CARD);
            newPaymentInstrument = paymentInstrumentUtils.copyPaymentCardToInstrument(newPaymentInstrument, paymentInstrument.creditCardNumber,
                paymentInstrument.creditCardType, Number(paymentInstrument.creditCardExpirationMonth), Number(paymentInstrument.creditCardExpirationYear),
                paymentInstrument.creditCardHolder, tokenId, tokenPaymentInstrument, tokenExpiryDateTime);
            if (!(newPaymentInstrument && newPaymentInstrument.getCreditCardNumber() && newPaymentInstrument.getCreditCardExpirationMonth() &&
                newPaymentInstrument.getCreditCardExpirationYear() && newPaymentInstrument.getCreditCardType() &&
                newPaymentInstrument.getCreditCardHolder())) {
                Transaction.rollback();
            }
            Transaction.commit();
        } else if (matchedPaymentInstrument != null && paymentInstrument.custom.updateTokenResult === 'true') {
            Transaction.wrap(function () {
                wallet.removePaymentInstrument(matchedPaymentInstrument);
            });
            tokenId = paymentInstrument.custom.csdkTokenId;
            tokenPaymentInstrument = paymentInstrument.custom.csdkTokenPi;
            tokenExpiryDateTime = paymentInstrument.custom.csdkTokenExp;
            Transaction.begin();
            newPaymentInstrument = wallet.createPaymentInstrument(PaymentInstrument.METHOD_CREDIT_CARD);
            newPaymentInstrument = paymentInstrumentUtils.copyPaymentCardToInstrument(newPaymentInstrument, paymentInstrument.creditCardNumber,
                   paymentInstrument.creditCardType, Number(paymentInstrument.creditCardExpirationMonth), Number(paymentInstrument.creditCardExpirationYear),
                   paymentInstrument.creditCardHolder, tokenId, tokenPaymentInstrument, tokenExpiryDateTime);
            if (!(newPaymentInstrument && newPaymentInstrument.getCreditCardNumber() && newPaymentInstrument.getCreditCardExpirationMonth() &&
                   newPaymentInstrument.getCreditCardExpirationYear() && newPaymentInstrument.getCreditCardType() &&
                   newPaymentInstrument.getCreditCardHolder())) {
                Transaction.rollback();
            }
            Transaction.commit();
        } else {
            return {
                success: true,
                canSavecard: 'false'
            };
        }
    }
    return {
        success: true
    };
}

/**
 * Authorization for Web Checkout SDK
 * @param {Object} serviceResponse - serviceResponse
 * @param {Object} paymentInstrument - paymentInstrument
 * @param {Object} customerObj - customerObj
 * @returns {Object} - response
 */
function checkAuthorizationWCSDK(serviceResponse, paymentInstrument, customerObj) {
    var utils = require('*/cartridge/scripts/common/utils');
    var cardAddResult;
    var canSavecard = '';
    var EnableTokenizationPref = Site.getCurrent().getCustomPreferenceValue('AWPEnableCCTokenization');
    var WorldpayConstants = require('*/cartridge/scripts/common/worldpayConstants');
    var responseContent = serviceResponse.content;
    var outcome = responseContent.outcome;
    if ((outcome && outcome.equalsIgnoreCase(WorldpayConstants.AUTHORIZED))) {
        if (EnableTokenizationPref && customerObj != null && customerObj.authenticated && paymentInstrument.custom.wpTokenRequested) {
            cardAddResult = addOrUpdateTokenforwebcsdk(serviceResponse, customerObj, paymentInstrument);
        }
        if (cardAddResult && cardAddResult.canSavecard === 'false') {
            canSavecard = cardAddResult.canSavecard;
        }
        delete session.privacy.verfiedToken;
        delete session.privacy.conflictMsg;
        delete session.privacy.updateresult;
        return {
            authorized: true,
            echoData: '',
            canSavecard: canSavecard
        };
    } else if (!empty(serviceResponse.errorName)) {
        return {
            error: true,
            errorMessage: utils.getConfiguredLabel('worldpay.error.codecancelled', 'worldpayError')
        };
    }
    return {
        error: true,
        errorkey: 'worldpay.error.code' + serviceResponse.errorCode,
        errorMessage: utils.getErrorMessage(serviceResponse.errorCode)
    };
}

module.exports = {
    checkAuthorizationAWP: checkAuthorizationAWP,
    addOrUpdateToken: addOrUpdateToken,
    checkAuthorizationWCSDK: checkAuthorizationWCSDK,
    addOrUpdateTokenforwebcsdk: addOrUpdateTokenforwebcsdk
};
