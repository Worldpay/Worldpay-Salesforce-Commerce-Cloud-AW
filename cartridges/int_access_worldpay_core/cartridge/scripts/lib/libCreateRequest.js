/* eslint-disable no-unused-vars */
/** *******************************************************************************
*
* Description: Contains the functions to construct the request object for the
* various Worldpay Authorize request.
*
*
/*********************************************************************************/
var Logger = require('dw/system/Logger');
var WorldpayConstants = require('*/cartridge/scripts/common/worldpayConstants');
var Resource = require('dw/web/Resource');
var CreateRequestHelper = require('*/cartridge/scripts/common/createRequestHelper.js');
var InstructionHelper = require('*/cartridge/scripts/common/instructionHelper');

/**
 * This function to create the initial request json for Credit card Authorization AWP
 * @param {dw.order.Order} orderObj - Current users's Order
 * @param {string} cvn - cvn
 * @param {dw.order.PaymentInstrument} paymentInstrument - payment intrument object
 * @param {Object} preferences - preferences object
 * @param {Object} authentication3ds - 3ds authentication response data
 * @return {Object} returns an order in json object
 */
function createInitialRequestCcAwp(
    orderObj,
    cvn,
    paymentInstrument,
    preferences,
    authentication3ds
) {
    var orderNumber = orderObj.orderNo.toString();
    var threedsAuthData = authentication3ds;
    var order = {};
    order.transactionReference = orderNumber;
    order.merchant = CreateRequestHelper.getMerchantEntity();
    var options = {
        ccType: { tokenType: 'card/token', plainType: 'card/plain' },
        cvn: cvn
    };
    order.instruction = InstructionHelper.getInstruction(
        orderObj,
        preferences,
        paymentInstrument,
        options
    );

    if (threedsAuthData) {
        threedsAuthData.type = '3DS';
        order.customer = {};
        order.customer.authentication = threedsAuthData;
    }

    return order;
}

/**
 * This function to create the Intelligent token request json for all card AWP
 * @param {dw.order.PaymentInstrument} paymentInstrument - payment intrument object
 * @param {Object} customer - customer
 * @return {Object} returns an token request in json object

 */
function createIntelligentTokenRequestCcAwp(paymentInstrument, customer) {
    var tokenRequest = {};
    var options = {
        ccType: { plainType: 'card/plain' }
    };
    tokenRequest.paymentInstrument = CreateRequestHelper.getCCDetailsMyAccount(
        paymentInstrument,
        options
    );
    tokenRequest.merchant = {
        entity: 'default'
    };
    tokenRequest.verificationCurrency = session.getCurrency().getCurrencyCode();
    tokenRequest.namespace = customer.getProfile().getCustomerNo();

    return tokenRequest;
}

/**
 * This function to create the token request json for Credit card AWP
 * @param {dw.order.Order} orderObj - Current users's Order
 * @param {dw.order.PaymentInstrument} paymentInstrument - payment intrument object
 * @return {Object} returns an token request in json object
 */
function createTokenRequestCcAwp(orderObj, paymentInstrument) {
    var tokenRequest = {};
    tokenRequest.description = Resource.msg(
        'worldpay.cc_token_request',
        'worldpay',
        null
    );
    var options = {
        ccType: { plainType: 'card/front' }
    };
    tokenRequest.paymentInstrument = CreateRequestHelper.getCCDetails(
        paymentInstrument,
        options
    );

    if (orderObj) {
        tokenRequest.paymentInstrument.billingAddress = CreateRequestHelper.getBillingAddress(
            orderObj
        );
    }
    // adding namespace as part of the request to resolve token conflict.
    var customerObject = orderObj.customer;
    if (customerObject && customerObject.authenticated) {
        tokenRequest.namespace = customerObject.getProfile().getCustomerNo();
    } else {
        tokenRequest.namespace = new Date().getTime().toString();
    }
    return tokenRequest;
}

/**
 * This function is to create the JWT Token request json for 3ds awp
 * @param {dw.order.Order} order - Current users's Order
 * @param {dw.order.PaymentInstrument} paymentInstrument - payment intrument object
 * @param {Object} preferences - worldpay site preferences
 * @return {Object} returns an token request in json object
 */
function createJWTRequest(order, paymentInstrument, preferences) {
    var orderNumber = order.getOrderNo();
    var creditCardHolder = paymentInstrument.creditCardHolder.toString();
    var ccNumber = paymentInstrument.creditCardNumber.toString();
    var ccExpM = paymentInstrument.creditCardExpirationMonth;
    var ccExpY = paymentInstrument.creditCardExpirationYear;
    var JWTRequest = {};
    JWTRequest.transactionReference = orderNumber;
    JWTRequest.merchant = CreateRequestHelper.getMerchantEntity();
    var options = {
        ccType: { tokenType: 'card/tokenized', plainType: 'card/front' }
    };
    JWTRequest.paymentInstrument = CreateRequestHelper.getCCDetails(
        paymentInstrument,
        options
    );
    return JWTRequest;
}


/**
 * This function is to create the JWT Token request json for 3ds awp
 * @param {dw.order.Order} order - Current users's Order
 * @param {dw.order.PaymentInstrument} paymentInstrument - payment intrument object
 * @param {Object} preferences - worldpay site preferences
 * @return {Object} returns an token request in json object
 */
function createJWTRequestForWCSDK(order, paymentInstrument, preferences) {
    var orderNumber = order.getOrderNo();
    var JWTRequestWCSDK = {};
    JWTRequestWCSDK.transactionReference = orderNumber;
    JWTRequestWCSDK.merchant = CreateRequestHelper.getMerchantEntity();
    var options = {
        ccType: { tokenType: 'card/tokenized' }
    };
    JWTRequestWCSDK.paymentInstrument = CreateRequestHelper.getPaymentDetailsForJWT(
        paymentInstrument,
        options
    );
    return JWTRequestWCSDK;
}

/**
 * This function is to create the 3ds authentication request json
 * @param {dw.order.Order} orderObj - Current users's Order
 * @param {dw.order.PaymentInstrument} paymentInstrument - payment intrument object
 * @param {Object} preferences - worldpay site preferences
 * @param {string} sessionID - sessionID returned from ddc
 * @return {Object} returns a json object
 */
function create3DsRequest(orderObj, paymentInstrument, preferences, sessionID) {
    var orderNumber = orderObj.orderNo.toString();
    var order = {};
    order.transactionReference = orderNumber;
    order.merchant = CreateRequestHelper.getMerchantEntity();
    order.instruction = {};
    var options = {
        ccType: { tokenType: 'card/tokenized', plainType: 'card/front' },
        excludeNarrative: true
    };
    order.instruction = InstructionHelper.getInstruction(
        orderObj,
        preferences,
        paymentInstrument,
        options
    );

    order.deviceData = CreateRequestHelper.getDeviceData(sessionID);
    order.challenge = CreateRequestHelper.getChallengeDetails(preferences);

    if (preferences.includeRiskData) {
        order.riskData = CreateRequestHelper.getRiskData(orderObj);
    }
    return order;
}
/**
 * This function is to create the 3ds authentication request json
 * @param {dw.order.Order} orderObj - Current users's Order
 * @param {dw.order.PaymentInstrument} paymentInstrument - payment intrument object
 * @param {Object} preferences - worldpay site preferences
 * @param {string} sessionID - sessionID returned from ddc
 * @return {Object} returns a json object
 */
function create3DsRequestWCSDK(orderObj, paymentInstrument, preferences, sessionID) {
    var orderNumber = orderObj.orderNo.toString();
    var order = {};
    order.transactionReference = orderNumber;
    order.merchant = CreateRequestHelper.getMerchantEntity();
    order.instruction = {};
    var options = {
        type: 'card/tokenized',
        excludeNarrative: true
    };
    order.instruction = InstructionHelper.getInstructionForWCSDK(
        orderObj,
        preferences,
        paymentInstrument,
        options
    );

    order.deviceData = CreateRequestHelper.getDeviceData(sessionID);
    order.challenge = CreateRequestHelper.getChallengeDetails(preferences);

    if (preferences.includeRiskData) {
        order.riskData = CreateRequestHelper.getRiskData(orderObj);
    }
    return order;
}

/**
 * This function is to create the 3ds authentication request json
 * @param {string} orderNo - Current users's Order number
 * @param {string} reference3ds - reference number returned from 3ds authentication call
 * @return {Object} returns a json object
 */
function create3DsVerificationRequest(orderNo, reference3ds) {
    var request = {};
    request.transactionReference = orderNo;
    request.merchant = CreateRequestHelper.getMerchantEntity();
    request.challenge = {};
    request.challenge.reference = reference3ds;
    return request;
}

/**

 * This function to create the initial request json for Credit card Authorization AWP
 * @param {dw.order.Order} orderObj - Current users's Order
 * @param {dw.order.PaymentInstrument} paymentInstrument - payment intrument object
 * @param {Object} preferences - preferences object
 * @return {Object} returns an order in json object
 */
function createAuthRequestGpay(orderObj, paymentInstrument, preferences) {
    var orderNumber = orderObj.orderNo.toString();
    var order = {};
    order.transactionReference = orderNumber;
    order.merchant = CreateRequestHelper.getMerchantEntity();
    var options = {
        type: 'card/wallet+googlepay'
    };
    order.instruction = {};
    order.instruction = InstructionHelper.getInstruction(
        orderObj,
        preferences,
        paymentInstrument,
        options
    );
    return order;
}

/**
 * This function to create the request for partial settle and refund from csc
 * @param {integer} amount - amount
 * @param {string} currency - currency
 * @return {Object} returns an token request in json object
 */
function createInitialRequestPartialActions(amount, currency) {
    var amountStringValue = amount.toString();
    var request = {
        value: {
            amount: amount,
            currency: currency
        },
        reference: amountStringValue
    };
    return request;
}

/**
 * This function to create the request for verifiedToken generation
 * @param {string} sessionState - The session Identifier(href) for webCSDK
 * @param {string} wsdkname - reference name from webCSDK form
 * @param {Object} customerObject - customer object
 * @return {Object} returns an JSON object
 */
function createVerifiedTokenRequestCcAwp(sessionState, wsdkname, customerObject) {
    var verifiedtokenRequest = {};
    verifiedtokenRequest.description = Resource.msg('webcsdk.verifiedtoken.description', 'worldpay', null);
    verifiedtokenRequest.paymentInstrument = CreateRequestHelper.getWebSdkDetails(sessionState, wsdkname);
    verifiedtokenRequest.paymentInstrument.type = 'card/checkout';
    verifiedtokenRequest.merchant = CreateRequestHelper.getMerchantEntity();
    verifiedtokenRequest.verificationCurrency = session.getCurrency().getCurrencyCode();
    if (customerObject && customerObject.authenticated) {
        verifiedtokenRequest.namespace = customerObject.getProfile().getCustomerNo();
    } else {
        verifiedtokenRequest.namespace = new Date().getTime().toString();
    }
    return verifiedtokenRequest;
}

/**
 * This function to create the request for Authorization using verifiedToken
 * @param {dw.order.Order} orderObj - Current users's Order
 *  @param {dw.order.PaymentInstrument} paymentInstrument - payment instrument object
 *  @param {Object} preferences - worldpay preferences
 *  @param {Object} authentication3ds - 3ds authentication response data
 * @return {Object} returns an JSON object
 */
function createAuthRequestWCSDK(orderObj, paymentInstrument, preferences, authentication3ds) {
    var orderNumber = orderObj.orderNo.toString();
    var threedsAuthData = authentication3ds;
    var order = {};
    order.transactionReference = orderNumber;
    order.merchant = CreateRequestHelper.getMerchantEntity();
    var options = {
        type: 'card/token'
    };
    order.instruction = InstructionHelper.getInstructionForWCSDK(
            orderObj,
            preferences,
            paymentInstrument,
            options
        );
    if (threedsAuthData) {
        threedsAuthData.type = '3DS';
        order.customer = {};
        order.customer.authentication = threedsAuthData;
    }
    return order;
}

/**
* Create the auth payment request for apple pay
* @param {Order} order - Order Object
* @param {Object} event - Encrypted Payment Bundle
* @returns {Object} requestXML - auth request XML
*/
function createApplePayAuthRequest(order, event) {
    var Utils = require('*/cartridge/scripts/common/utils');
    var WorldpayPreferences = require('*/cartridge/scripts/object/worldpayPreferences');
    var worldPayPreferences = new WorldpayPreferences();
    var preferences = worldPayPreferences.worldPayPreferencesInit();
    var orderNo = order.orderNo;
    var amount = order.totalGrossPrice.value;
    amount = (amount.toFixed(2) * (Math.pow(10, preferences.currencyExponent))).toFixed(0);
    var paymentData = event.payment.token.paymentData;
    var header = paymentData.header;
    var walletToken = {
        signature: paymentData.signature,
        version: paymentData.version,
        data: paymentData.data,
        header: {
            ephemeralPublicKey: header.ephemeralPublicKey,
            publicKeyHash: header.publicKeyHash,
            transactionId: header.transactionId
        }
    };
    var reqJson = {
        transactionReference: orderNo,
        merchant: {
            entity: WorldpayConstants.MERCHANT_ENTITY
        },
        instruction: {
            narrative: {
                line1: order.orderNo
            },
            value: {
                currency: order.currencyCode,
                amount: Number(amount)
            },
            paymentInstrument: {
                type: 'card/wallet+applepay',
                walletToken: JSON.stringify(walletToken)
            }
        }
    };
    return reqJson;
}

/** Exported functions **/
module.exports = {
    createInitialRequestCcAwp: createInitialRequestCcAwp,
    createInitialRequestPartialActions: createInitialRequestPartialActions,
    createIntelligentTokenRequestCcAwp: createIntelligentTokenRequestCcAwp,
    createTokenRequestCcAwp: createTokenRequestCcAwp,
    createJWTRequest: createJWTRequest,
    createJWTRequestForWCSDK: createJWTRequestForWCSDK,
    create3DsRequest: create3DsRequest,
    create3DsVerificationRequest: create3DsVerificationRequest,
    createAuthRequestGpay: createAuthRequestGpay,
    createVerifiedTokenRequestCcAwp: createVerifiedTokenRequestCcAwp,
    createAuthRequestWCSDK: createAuthRequestWCSDK,
    create3DsRequestWCSDK: create3DsRequestWCSDK,
    createApplePayAuthRequest: createApplePayAuthRequest
};
