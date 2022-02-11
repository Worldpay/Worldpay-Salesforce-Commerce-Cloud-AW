'use strict';

var WorldpayConstants = require('*/cartridge/scripts/common/worldpayConstants');
var Resource = require('dw/web/Resource');
var Site = require('dw/system/Site');
var Logger = require('dw/system/Logger');

/**
 * Return billing address object for the current order
 * @param {dw.order.Order} order - order object
 * @returns {Object} billing address
 */
function getBillingAddress(order) {
    var billingAddress = order.getBillingAddress();
    if (!empty(billingAddress)) {
        return {
            address1: billingAddress.address1,
            address2: billingAddress.address2,
            postalCode: billingAddress.postalCode,
            city: billingAddress.city,
            state: billingAddress.stateCode,
            countryCode: billingAddress.countryCode.value
        };
    }
    return null;
}

/**
 * Returns CC details
 * @param {dw.order.PaymentInstrument} paymentInstrument - Order payment instrument
 * @param {Object} options - object for passing additional parameters
 * @returns {Object} CC details object
 */
function getCCDetails(paymentInstrument, options) {
    var tokenHref;
    var isMagicValuesEnabled = Site.getCurrent().getCustomPreferenceValue('enableMagicValues');
    var isCvvDisabled = Site.getCurrent().getCustomPreferenceValue('isAWPCvvDisabled');
    if ('awpCCTokenData' in paymentInstrument.custom && paymentInstrument.custom.awpCCTokenExpiry && !empty(paymentInstrument.custom.awpCCTokenData) && paymentInstrument.custom.awpCCTokenExpiry.getTime() > new Date().getTime()) {
        tokenHref = paymentInstrument.custom.awpCCTokenData;
            if (Object.prototype.hasOwnProperty.call(options, 'cvn') && options.cvn) {
                return {
                    type: options.ccType.tokenType,
                    href: tokenHref,
                    cvc : options.cvn
                }; }
        return {
            type: options.ccType.tokenType,
            href: tokenHref
        }; 
    } else if ('awpCCTokenData' in paymentInstrument.custom && !empty(paymentInstrument.custom.awpCCTokenData)) {
            if (!isCvvDisabled && options.cvn){
            return {
            type: options.ccType.tokenType,
            href: paymentInstrument.custom.awpCCTokenData,
            cvc:options.cvn
            };
        } else{
            return{
            type: options.ccType.tokenType,
            href: paymentInstrument.custom.awpCCTokenData
        }; }
    } else {
        var cardHolderName = (isMagicValuesEnabled) ? paymentInstrument.creditCardHolder.toString() :
            paymentInstrument.creditCardHolder.toString().toUpperCase();
        var ccObj = {};
        
        if (session.privacy.verfiedToken){
            ccObj.type = options.ccType.tokenType;
            ccObj.href = session.privacy.verfiedToken;
        }
        else {
            ccObj.type = options.ccType.plainType;
            ccObj.cardHolderName = cardHolderName;
            ccObj.cardNumber = paymentInstrument.creditCardNumber.toString();
            var cardExpiryDate = {
                        month: paymentInstrument.creditCardExpirationMonth,
                        year: paymentInstrument.creditCardExpirationYear
                };
            ccObj.cardExpiryDate = cardExpiryDate;
        }
        if (!isCvvDisabled) {
            if (Object.prototype.hasOwnProperty.call(options, 'cvn')) {
                ccObj.cvc = options.cvn;
            }
        } else if (Object.prototype.hasOwnProperty.call(options, 'cvn') && options.cvn) {
            ccObj.cvc = options.cvn;
        }
        return ccObj;
    }
}
/**
 * Returns CC details for My Account
 * @param {dw.order.PaymentInstrument} paymentInstrument - Order payment instrument
 * @param {Object} options - object for passing additional parameters
 * @returns {Object} CC details object
 */
function getCCDetailsMyAccount(paymentInstrument, options) {
    var isMagicValuesEnabled = Site.getCurrent().getCustomPreferenceValue('enableMagicValues');
    // To avoid the possible name case conflicts in Worldpay we always send name in upper case to Worldpay
    var cardHolderName = (isMagicValuesEnabled) ? paymentInstrument.creditCardHolder :
        paymentInstrument.creditCardHolder.toString().toUpperCase();

    var ccObj = {
        type: options.ccType.plainType,
        cardHolderName: cardHolderName,
        cardNumber: paymentInstrument.creditCardNumber,
        cardExpiryDate: {
            month: paymentInstrument.creditCardExpirationMonth,
            year: paymentInstrument.creditCardExpirationYear
        }
    };
    if (Object.prototype.hasOwnProperty.call(options, 'cvn')) {
        ccObj.cvn = options.cvn;
    }
    return ccObj;
}
/**
 * Returns merhant entity details
 * @returns {Object} Merchant entity object
 */
function getMerchantEntity() {
    let entity = Site.current.getCustomPreferenceValue('merchantEntity');
    if (entity) {
        return { entity: entity };
    }
    Logger.getLogger('worldpay').error('Missing Merchant Entity in the preferences');
}

/**
 * returns device data object
 * @param {string} sessionID - sessionID collected in DDC
 * @returns {Object} device data object
 */
function getDeviceData(sessionID) {
    let obj = {
        acceptHeader: 'text/html',
        userAgentHeader: request.getHttpUserAgent()
    };
    if (sessionID) {
        obj.collectionReference = sessionID;
    }
    return obj;
}

/**
 * returns challenge details object
 * @param {Object} preferences - worldpay preferences object
 * @returns {Object} challenge object
 */
function getChallengeDetails(preferences) {
    return {
        windowSize: preferences.challengeWindowSize.value,
        preference: preferences.challengePreference.value,
        returnUrl: dw.web.URLUtils.https('Worldpay-Handle3ds').toString()
    };
}

/**
 * Returns risk data
 * @param {dw.order.Order} order - current order object
 * @returns {Object} risk data
 */
function getRiskData(order) {
    var account = {};
    var transaction = {};
    if (customer.authenticated) {
        account.type = 'registeredUser';
    } else {
        account.type = 'guestUser';
    }
    account.email = order.getCustomerEmail();
    var billingAddress = order.getBillingAddress();
    transaction.firstName = billingAddress.firstName;
    transaction.lastName = billingAddress.lastName;
    transaction.phoneNumber = billingAddress.phone;
    return {
        account: account,
        transaction: transaction
    };
}

/**
 * Returns WebCSDK details
 * @param {string} sessionState - The session Identifier(href) for webCSDK
 * @param {string} wsdkname -  reference name from webCSDK form
 * @returns {Object} WebCSDK details object
 */
function getWebSdkDetails(sessionState, wsdkname) {
    let ccObj = {
        cardHolderName: wsdkname
    };
    if (!empty(sessionState)) {
        ccObj.sessionHref = sessionState;
    }
    return ccObj;
}

function getPaymentDetailsForJWT(paymentInstrument, options) {
    if ('awpCCTokenData' in paymentInstrument.custom && !empty(paymentInstrument.custom.awpCCTokenData)) {
        let tokenHref = paymentInstrument.custom.awpCCTokenData;
        return {
            type: options.ccType.tokenType,
            href: tokenHref
        };
    }
}

module.exports = {
    getBillingAddress: getBillingAddress,
    getWebSdkDetails: getWebSdkDetails,
    getMerchantEntity: getMerchantEntity,
    getDeviceData: getDeviceData,
    getChallengeDetails: getChallengeDetails,
    getRiskData: getRiskData,
    getCCDetails: getCCDetails,
    getCCDetailsMyAccount: getCCDetailsMyAccount,
    getPaymentDetailsForJWT: getPaymentDetailsForJWT
};
