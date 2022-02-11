/* eslint-disable no-unused-vars */
/** *******************************************************************************
*
* Description: Contains the functions to construct the request object for the
* various Worldpay Authorize request.
*
*
/*********************************************************************************/
var Logger = require('dw/system/Logger');
var Resource = require('dw/web/Resource');
var createRequestHelper = require('*/cartridge/scripts/common/createRequestHelper.js');
var instructionHelper = require('*/cartridge/scripts/common/instructionHelper');
var Site = require('dw/system/Site');
var worldpayConstants = require('*/cartridge/scripts/common/worldpayConstants');

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
    order.merchant = createRequestHelper.getMerchantEntity();
    var options = {
        ccType: { tokenType: 'card/token', plainType: 'card/plain' }
    };
    if (cvn && cvn !== 'undefined') {
        options.cvn = cvn;
    }
    order.instruction = instructionHelper.getInstruction(
        orderObj,
        preferences,
        paymentInstrument,
        options
    );

    if (session.privacy.riskProfile !== null || threedsAuthData) {
        order.customer = {};
    }
    if (session.privacy.riskProfile !== null) {
        order.customer.riskProfile = session.privacy.riskProfile;
    }
    if (threedsAuthData) {
        threedsAuthData.type = '3DS';
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
    tokenRequest.paymentInstrument = createRequestHelper.getCCDetailsMyAccount(
        paymentInstrument,
        options
    );
    tokenRequest.merchant = {
        entity: Site.current.getCustomPreferenceValue('merchantEntity')
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
    tokenRequest.paymentInstrument = createRequestHelper.getCCDetails(
        paymentInstrument,
        options
    );

    if (orderObj) {
        tokenRequest.paymentInstrument.billingAddress = createRequestHelper.getBillingAddress(
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
    var JWTRequest = {};
    JWTRequest.transactionReference = orderNumber;
    JWTRequest.merchant = createRequestHelper.getMerchantEntity();
    var options = {
        ccType: { tokenType: 'card/tokenized', plainType: 'card/front' }
    };
    JWTRequest.paymentInstrument = createRequestHelper.getCCDetails(
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
    JWTRequestWCSDK.merchant = createRequestHelper.getMerchantEntity();
    var options = {
        ccType: { tokenType: 'card/tokenized' }
    };
    JWTRequestWCSDK.paymentInstrument = createRequestHelper.getPaymentDetailsForJWT(
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
    order.merchant = createRequestHelper.getMerchantEntity();
    order.instruction = {};
    var options = {
        ccType: { tokenType: 'card/tokenized', plainType: 'card/front' },
        excludeNarrative: true
    };
    order.instruction = instructionHelper.getInstruction(
        orderObj,
        preferences,
        paymentInstrument,
        options
    );

    order.deviceData = createRequestHelper.getDeviceData(sessionID);
    order.challenge = createRequestHelper.getChallengeDetails(preferences);

    if (preferences.includeRiskData) {
        order.riskData = createRequestHelper.getRiskData(orderObj);
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
    order.merchant = createRequestHelper.getMerchantEntity();
    order.instruction = {};
    var options = {
        type: 'card/tokenized',
        excludeNarrative: true
    };
    order.instruction = instructionHelper.getInstructionForWCSDK(
        orderObj,
        preferences,
        paymentInstrument,
        options
    );

    order.deviceData = createRequestHelper.getDeviceData(sessionID);
    order.challenge = createRequestHelper.getChallengeDetails(preferences);

    if (preferences.includeRiskData) {
        order.riskData = createRequestHelper.getRiskData(orderObj);
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
    request.merchant = createRequestHelper.getMerchantEntity();
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
    order.merchant = createRequestHelper.getMerchantEntity();
    var options = {
        type: 'card/wallet+googlepay'
    };
    order.instruction = {};
    order.instruction = instructionHelper.getInstruction(
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
    verifiedtokenRequest.paymentInstrument = createRequestHelper.getWebSdkDetails(sessionState, wsdkname);
    verifiedtokenRequest.paymentInstrument.type = 'card/checkout';
    verifiedtokenRequest.merchant = createRequestHelper.getMerchantEntity();
    verifiedtokenRequest.verificationCurrency = session.getCurrency().getCurrencyCode();
    if (customerObject && customerObject.authenticated) {
        verifiedtokenRequest.namespace = customerObject.getProfile().getCustomerNo();
    } else {
        verifiedtokenRequest.namespace = new Date().getTime().toString();
    }
    return verifiedtokenRequest;
}
/**
 * @param {string} cardHoldername The card holder name
 * @param {Object} customerObject Customer Details
 * @param {string} cvn Security Number
 * @param {Object} pi Payment Instrument
 * @returns {Object} verifiedtokenRequest
 */
function createVerifiedTokenRequestCcAwpDirect(cardHoldername, customerObject, cvn, pi) {
    var verifiedtokenRequest = {};
    verifiedtokenRequest.description = Resource.msg('webcsdk.verifiedtoken.description', 'worldpay', null);
    var ccObj = {
        type: 'card/plain',
        cardHolderName: cardHoldername,
        cardNumber: pi.creditCardNumber.toString(),
        cardExpiryDate: {
            month: pi.creditCardExpirationMonth,
            year: pi.creditCardExpirationYear
        }
    };
    if (cvn) {
        ccObj.cvc = cvn;
    }
    verifiedtokenRequest.paymentInstrument = ccObj;
    verifiedtokenRequest.merchant = createRequestHelper.getMerchantEntity();
    verifiedtokenRequest.verificationCurrency = session.getCurrency().getCurrencyCode();
    if (customerObject && customerObject.authenticated && pi.custom.wpTokenRequested) {
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
    order.merchant = createRequestHelper.getMerchantEntity();
    var options = {
        type: 'card/token'
    };
    order.instruction = instructionHelper.getInstructionForWCSDK(
            orderObj,
            preferences,
            paymentInstrument,
            options
        );
    if (threedsAuthData || session.privacy.riskProfile !== null) {
        order.customer = {};
    }
    if (session.privacy.riskProfile !== null) {
        order.customer.riskProfile = session.privacy.riskProfile;
    }
    if (threedsAuthData) {
        threedsAuthData.type = '3DS';
        order.customer.authentication = threedsAuthData;
    }
    return order;
}

/**
 * This function to create the request for CVV checkout Authorization using verifiedToken and the cvv href
 * @param {dw.order.Order} orderObj - Current users's Order
 *  @param {dw.order.PaymentInstrument} paymentInstrument - payment instrument object
 *  @param {Object} preferences - worldpay preferences
 *  @param {Object} authentication3ds - 3ds authentication response data
 * @return {Object} returns an JSON object
 */
function createCVVAuthRequestWCSDK(orderObj, paymentInstrument, preferences, authentication3ds) {
    var orderNumber = orderObj.orderNo.toString();
    var threedsAuthData = authentication3ds;
    var order = {};
    order.transactionReference = orderNumber;
    order.merchant = createRequestHelper.getMerchantEntity();
    var options = {
        type: 'card/checkout'
    };
    order.instruction = instructionHelper.getInstructionForWCSDK(
            orderObj,
            preferences,
            paymentInstrument,
            options
        );
    if (threedsAuthData || session.privacy.riskProfile !== null) {
        order.customer = {};
    }
    if (session.privacy.riskProfile !== null) {
        order.customer.riskProfile = session.privacy.riskProfile;
    }
    if (threedsAuthData) {
        threedsAuthData.type = '3DS';
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
            entity: Site.current.getCustomPreferenceValue('merchantEntity')
        },
        instruction: {
            narrative: {
                line1: Site.current.getCustomPreferenceValue('narrativeLine1')
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

/**
 * @param {Object} orderObj - Order object
 * @param {Object} paymentInstrument - credit card paymentinstrument
 * @param {Object} preferences - worldpay preferences
 * @param {string} tokenUrl - verified token url
 * @returns {Object} order request
 */
function createOrderExemptionRequest(orderObj, paymentInstrument, preferences) {
    var orderNumber = orderObj.orderNo.toString();
    var order = {};
    var amount = orderObj.totalGrossPrice.value;
    amount = (amount.toFixed(2) * (Math.pow(10, preferences.currencyExponent))).toFixed(0);
    order.transactionReference = orderNumber;
    order.merchant = createRequestHelper.getMerchantEntity();
    order.instruction = {};
    order.riskData = {};
    order.riskData.shipping = {};
    var ccObj = {
        type: 'card/tokenized',
        href: session.privacy.verfiedToken
    };
    order.instruction.paymentInstrument = ccObj;
    var value = {
        currency: orderObj.currencyCode,
        amount: Number(amount)
    };
    order.instruction.value = value;
    var account = {
        email: orderObj.customerEmail
    };
    order.riskData.account = account;
    var transaction = {
        firstName: orderObj.customer.profile.firstName,
        lastName: orderObj.customer.profile.lastName,
        phoneNumber: orderObj.customer.profile.phoneHome
    };
    order.riskData.transaction = transaction;
    order.riskData.shipping.firstName = orderObj.customer.profile.firstName;
    order.riskData.shipping.lastName = orderObj.customer.profile.lastName;
    var shippingAddress = {
        address1: orderObj.shipments[0].shippingAddress.address1,
        address2: orderObj.shipments[0].shippingAddress.address2,
        postalCode: orderObj.shipments[0].shippingAddress.postalCode,
        city: orderObj.shipments[0].shippingAddress.city,
        countryCode: orderObj.shipments[0].shippingAddress.countryCode.value,
        phoneNumber: orderObj.customer.profile.phoneHome
    };
    order.riskData.shipping.address = shippingAddress;
    return order;
}

/**
 * Create the auth payment request for ach pay
 * @param {Object} orderObj - Order object
 * @param {Object} paymentInstrument - credit card paymentinstrument
 * @param {Object} preferences - worldpay preferences
 * @returns {Object} order request
 */
function createRequestACHPay(orderObj, paymentInstrument, preferences) {
    var orderNumber = orderObj.orderNo.toString();
    var order = {};
    var amount = orderObj.totalGrossPrice.value;
    amount = (amount.toFixed(2) * (Math.pow(10, preferences.currencyExponent))).toFixed(0);
    order.transactionReference = orderNumber;
    order.merchant = createRequestHelper.getMerchantEntity();
    order.instruction = {};
    var narrative = {
        line1: Site.current.getCustomPreferenceValue('narrativeLine1')
    };
    order.instruction.narrative = narrative;
    var options = {
        type: worldpayConstants.BANKACCOUNTS_US
    };
    let accountType = paymentInstrument.custom.achAccountType.toString().toLowerCase();
    let achCompanyName;
    if (accountType === worldpayConstants.CORPORATE || accountType === worldpayConstants.CORPSAVINGS) {
        achCompanyName = paymentInstrument.custom.achCompanyName;
    }
    var AchObj = {
        type: options.type,
        accountType: accountType === worldpayConstants.CORPSAVINGS ? worldpayConstants.CORPORATESAVINGS : accountType,
        accountNumber: paymentInstrument.bankAccountNumber,
        routingNumber: paymentInstrument.bankRoutingNumber,
        checkNumber: paymentInstrument.custom.achCheckNumber
    };
    order.instruction.paymentInstrument = AchObj;
    if (achCompanyName && achCompanyName !== '') {
        order.instruction.paymentInstrument.companyName = achCompanyName;
    }
    var billingAddress = orderObj.getBillingAddress();
    var achBillingAddress = {
        firstName: orderObj.billingAddress.firstName,
        lastName: orderObj.billingAddress.lastName,
        address1: billingAddress.address1,
        address2: billingAddress.address2,
        postalCode: billingAddress.postalCode,
        city: billingAddress.city,
        state: billingAddress.stateCode,
        countryCode: billingAddress.countryCode.value
    };
    order.instruction.paymentInstrument.billingAddress = achBillingAddress;
    var value = {
        currency: orderObj.currencyCode,
        amount: Number(amount)
    };
    order.instruction.value = value;
    return order;
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
    createApplePayAuthRequest: createApplePayAuthRequest,
    createVerifiedTokenRequestCcAwpDirect: createVerifiedTokenRequestCcAwpDirect,
    createCVVAuthRequestWCSDK: createCVVAuthRequestWCSDK,
    createOrderExemptionRequest: createOrderExemptionRequest,
    createRequestACHPay: createRequestACHPay
};
