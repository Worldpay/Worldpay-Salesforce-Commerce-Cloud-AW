'use strict';

var LibCreateRequest = require('*/cartridge/scripts/lib/libCreateRequest');
var Utils = require('*/cartridge/scripts/common/utils');
var Logger = require('dw/system/Logger');
var WorldpayConstants = require('*/cartridge/scripts/common/worldpayConstants');
var ServiceResponseHandler = require('*/cartridge/scripts/service/serviceResponseHandler');
var Resource = require('dw/web/Resource');
var Site = require('dw/system/Site');
/**
 * Service wrapper for Credit Card orders Access Worldpay
 * @param {dw.order.Order} orderObj - Current users's Order
 * @param {string} cvn - card cvn
 * @param {dw.order.PaymentInstrument} paymentInstrument - payment instrument object
 * @param {Object} preferences - worldpay preferences
 * @param {Object} authentication3ds - 3ds authentication data
 * @return {Object} returns an JSON objectAR
 */
function ccAuthorizeRequestServiceAWP(orderObj, cvn, paymentInstrument, preferences, authentication3ds) {
    var result; var parsedResponse; var errorCode; var errorMessage;
    var order = LibCreateRequest.createInitialRequestCcAwp(orderObj, cvn, paymentInstrument, preferences, authentication3ds);
    if (!order) {
        errorCode = Resource.msg('service.invalid.request', 'worldpay', null);
        errorMessage = Resource.msg('service.invalid.request.msg', 'worldpay', null);
        return {
            error: true,
            errorCode: errorCode,
            errorMessage: errorMessage
        };
    }
    var requestHeader = { 'Content-Type': 'application/vnd.worldpay.payments-v6+json' };
    var responseObject = Utils.serviceCallAWP(order, requestHeader, preferences, WorldpayConstants.PAYMENT_SERVICE_ID, preferences.getAPIEndpoint('payments', 'authorization'));

    var handleResult = ServiceResponseHandler.validateServiceResponse(responseObject);
    if (handleResult && Object.prototype.hasOwnProperty.call(handleResult, 'error') && handleResult.error) {
        return handleResult;
    }

    result = responseObject.object;
    parsedResponse = Utils.parseResponse(result);
    var maskedResponse = Utils.getLoggableRequestAWP(result);
    Logger.getLogger('worldpay').debug('CCAuthorizeRequestService Response string : ' + maskedResponse);
    return {
        success: true,
        serviceresponse: parsedResponse,
        responseObject: responseObject
    };
}

/**
 * Service wrapper for Credit Card Intelligent token creation Access Worldpay
 * @param {dw.order.PaymentInstrument} paymentInstrument - paymentInstrument for which token will be created
 * @param {Object} preferences - Object containing AWP site preferences
 * @param {Object} customer - Customer Object
 * @return {Object} returns an JSON object
 */
function ccIntelligentTokenRequestServiceAWP(paymentInstrument, preferences, customer) {
    var result; var parsedResponse; var errorCode; var errorMessage; var conflictMsg;
    var tokenRequest = LibCreateRequest.createIntelligentTokenRequestCcAwp(paymentInstrument, customer);
    if (!tokenRequest) {
        errorCode = Resource.msg('service.invalid.request', 'worldpay', null);
        errorMessage = Resource.msg('service.invalid.request.msg', 'worldpay', null);
        return {
            error: true,
            errorCode: errorCode,
            errorMessage: errorMessage
        };
    }
    var requestHeader = {
        'Content-Type': 'application/vnd.worldpay.verified-tokens-v2.hal+json',
        Accept: 'application/vnd.worldpay.verified-tokens-v2.hal+json'
    };
    var responseObject = Utils.serviceCallAWP(tokenRequest, requestHeader, preferences, WorldpayConstants.VERIFIED_TOKEN_SERVICE_ID);
    var handleResult = ServiceResponseHandler.validateServiceResponse(responseObject);
    // eslint-disable-next-line eqeqeq
    if (handleResult && Object.prototype.hasOwnProperty.call(handleResult, 'error') && handleResult.errorCode == '409') {
        result = handleResult.errorMessage;
        conflictMsg = handleResult.conflictMsg;
    }
    // eslint-disable-next-line eqeqeq
    if (handleResult && Object.prototype.hasOwnProperty.call(handleResult, 'error') && handleResult.error && handleResult.errorCode != '409') {
        return handleResult;
    }
    // eslint-disable-next-line eqeqeq
    if (handleResult.errorCode != '409') {
        result = responseObject.object;
    }
    parsedResponse = Utils.parseResponse(result);
    var maskedResponse = Utils.getLoggableRequestAWP(result);
    Logger.getLogger('worldpay').debug('CCTokenRequestService Response string : ' + maskedResponse);
    return {
        error: false,
        serviceResponse: parsedResponse,
        responseObject: responseObject,
        conflictMsg: conflictMsg
    };
}

/**
 * Service wrapper for Credit Card token creation Access Worldpay
 * @param {dw.order.Order} orderObj - Current users's Order
 * @param {dw.order.PaymentInstrument} paymentInstrument - paymentInstrument for which token will be created
 * @param {Object} preferences - Object containing AWP site preferences
 * @return {Object} returns an JSON object
 */
function ccTokenRequestServiceAWP(orderObj, paymentInstrument, preferences) {
    var result; var parsedResponse; var errorCode; var errorMessage; var conflictMsg;
    var tokenRequest = LibCreateRequest.createTokenRequestCcAwp(orderObj, paymentInstrument);
    if (!tokenRequest) {
        errorCode = Resource.msg('service.invalid.request', 'worldpay', null);
        errorMessage = Resource.msg('service.invalid.request.msg', 'worldpay', null);
        return {
            error: true,
            errorCode: errorCode,
            errorMessage: errorMessage
        };
    }
    var requestHeader = {
        'Content-Type': 'application/vnd.worldpay.tokens-v1.hal+json',
        Accept: 'application/vnd.worldpay.tokens-v1.hal+json'
    };
    var responseObject = Utils.serviceCallAWP(tokenRequest, requestHeader, preferences, WorldpayConstants.TOKEN_SERVICE_ID);
    var handleResult = ServiceResponseHandler.validateServiceResponse(responseObject);
    // eslint-disable-next-line eqeqeq
    if (handleResult && Object.prototype.hasOwnProperty.call(handleResult, 'error') && handleResult.errorCode == '409') {
        result = handleResult.errorMessage;
        conflictMsg = handleResult.conflictMsg;
    }
    // eslint-disable-next-line eqeqeq
    if (handleResult && Object.prototype.hasOwnProperty.call(handleResult, 'error') && handleResult.error && handleResult.errorCode != '409') {
        return handleResult;
    }
    // eslint-disable-next-line eqeqeq
    if (handleResult.errorCode != '409') {
        result = responseObject.object;
    }
    parsedResponse = Utils.parseResponse(result);
    var maskedResponse = Utils.getLoggableRequestAWP(result);
    Logger.getLogger('worldpay').debug('CCTokenRequestService Response string : ' + maskedResponse);
    return {
        error: false,
        serviceResponse: parsedResponse,
        responseObject: responseObject,
        conflictMsg: conflictMsg
    };
}


/**
 * Function to create request for deleting payment token from Account dashboard
 * @param {Object} cToken - PaymentInstrument Token
 * @param {string} customerNo - Customer Number
 * @param {Object} preferences - worldpay preferences
 * @return {Object} returns an JSON object
 */
function deleteToken(cToken) {
    var responseObject; var handleResult;
    var requestHeader = {
        'Content-Type': 'application/vnd.worldpay.tokens-v1.hal+json',
        Accept: 'application/vnd.worldpay.tokens-v1.hal+json'
    };
    responseObject = Utils.serviceCallWithURL(requestHeader, WorldpayConstants.TOKEN_SERVICE_ID, cToken, 'DELETE');
    handleResult = ServiceResponseHandler.validateServiceResponse(responseObject);
    if (handleResult && Object.prototype.hasOwnProperty.call(handleResult, 'error') && handleResult.error) {
        return handleResult;
    }

    return {
        success: true
    };
}

/**
 * Service wrapper CSC actions
 * @param {string} url - csc action url
 * @return {Object} returns an JSON object
 */
function cscActions(url) {
    var result; var parsedResponse;
    var requestHeader = { 'Content-Type': 'application/vnd.worldpay.payments-v6+json' };
    var responseObject = Utils.serviceCallWithURL(requestHeader, WorldpayConstants.PAYMENT_SERVICE_ID, url);

    var handleResult = ServiceResponseHandler.validateServiceResponse(responseObject);
    if (handleResult && Object.prototype.hasOwnProperty.call(handleResult, 'error') && handleResult.error) {
        return handleResult;
    }
    result = responseObject.object;
    parsedResponse = Utils.parseResponse(result);
    var maskedResponse = Utils.getLoggableRequestAWP(result);
    Logger.getLogger('worldpay').debug('CSC : CCAuthorizeRequestService Response string : ' + maskedResponse);
    return {
        success: true,
        serviceresponse: parsedResponse,
        responseObject: responseObject
    };
}

/**
 * Service wrapper making JWT token request
 * @param {Object} order - current order object
 * @param {dw.order.PaymentInstrument} pi - order payment instrument
 * @param {Object} preferences - worldpay preferences object
 * @return {Object} returns a json object
 */
function jwtTokenRequest(order, pi, preferences) {
    var result; var parsedResponse;
    var JWTRequest;
    var ccSecurityModel = Site.current.getCustomPreferenceValue('ccSecurityModel').value;
    if (pi.paymentMethod.equals('CREDIT_CARD') && ccSecurityModel === 'DIRECT') {
        JWTRequest = LibCreateRequest.createJWTRequest(order, pi, preferences);
    } else if (pi.paymentMethod.equals('CREDIT_CARD') && ccSecurityModel === 'WEB_SDK') {
        JWTRequest = LibCreateRequest.createJWTRequestForWCSDK(order, pi, preferences);
    }
    var requestHeader = {
        'Content-Type': 'application/vnd.worldpay.verifications.customers-v2.hal+json',
        Accept: 'application/vnd.worldpay.verifications.customers-v2.hal+json'
    };
    var responseObject = Utils.serviceCallAWP(JWTRequest, requestHeader, preferences, WorldpayConstants.THREE_DS_SERVICE_ID,
        preferences.getAPIEndpoint('3ds', 'jwt'));

    var handleResult = ServiceResponseHandler.validateServiceResponse(responseObject);
    if (handleResult && Object.prototype.hasOwnProperty.call(handleResult, 'error') && handleResult.error)    	{ return handleResult; }

    result = responseObject.object;
    parsedResponse = Utils.parseResponse(result);
    var maskedResponse = Utils.getLoggableRequestAWP(result);
    Logger.getLogger('worldpay').debug('JWT Response string : ' + maskedResponse);
    return {
        success: true,
        serviceresponse: parsedResponse,
        responseObject: responseObject
    };
}

/**
 * Service wrapper making authenticating request to 3ds
 * @param {Object} orderObj - current order object
 * @param {dw.order.PaymentInstrument} paymentInstrument - order payment instrument
 * @param {Object} preferences - worldpay site preferences
 * @param {string} sessionID - session ID returned from ddc
 * @return {Object} returns a json object
 */
function authenticationRequest3Ds(orderObj, paymentInstrument, preferences, sessionID) {
    var result; var parsedResponse;
    var request;
    var ccSecurityModel = Site.current.getCustomPreferenceValue('ccSecurityModel').value;
    if (paymentInstrument.paymentMethod.equals('CREDIT_CARD') && ccSecurityModel === 'DIRECT') {
        request = LibCreateRequest.create3DsRequest(orderObj, paymentInstrument, preferences, sessionID);
    } else if (paymentInstrument.paymentMethod.equals('CREDIT_CARD') && ccSecurityModel === 'WEB_SDK') {
        request = LibCreateRequest.create3DsRequestWCSDK(orderObj, paymentInstrument, preferences, sessionID);
    }
    var requestHeader = {
        'Content-Type': 'application/vnd.worldpay.verifications.customers-v1.hal+json',
        Accept: 'application/vnd.worldpay.verifications.customers-v1.hal+json'
    };
    var responseObject = Utils.serviceCallAWP(request, requestHeader, preferences, WorldpayConstants.THREE_DS_SERVICE_ID,
        preferences.getAPIEndpoint('3ds', 'authentication'));

    var handleResult = ServiceResponseHandler.validateServiceResponse(responseObject);
    if (handleResult && Object.prototype.hasOwnProperty.call(handleResult, 'error') && handleResult.error) {
        return handleResult;
    }

    result = responseObject.object;
    parsedResponse = Utils.parseResponse(result);
    var maskedResponse = Utils.getLoggableRequestAWP(result);
    Logger.getLogger('worldpay').debug('3ds authorize Response string : ' + maskedResponse);

    return {
        success: true,
        error: false,
        serviceresponse: parsedResponse,
        responseObject: responseObject
    };
}

/**
 * Service wrapper making verification request to 3ds
 * @param {string} orderNo - current order number
 * @param {Object} preferences - worldpay site preferences
 * @param {string} reference3ds - reference number returned in the authentication call
 * @return {Object} returns a json object
 */
function verificationRequest3ds(orderNo, preferences, reference3ds) {
    var result; var parsedResponse;

    var request = LibCreateRequest.create3DsVerificationRequest(orderNo, reference3ds);
    var requestHeader = {
        'Content-Type': 'application/vnd.worldpay.verifications.customers-v2.hal+json',
        Accept: 'application/vnd.worldpay.verifications.customers-v2.hal+json'
    };
    var responseObject = Utils.serviceCallAWP(request, requestHeader, preferences, WorldpayConstants.THREE_DS_SERVICE_ID,
        preferences.getAPIEndpoint('3ds', 'verification'));

    var handleResult = ServiceResponseHandler.validateServiceResponse(responseObject);
    if (handleResult && Object.prototype.hasOwnProperty.call(handleResult, 'error') && handleResult.error) {
        return handleResult;
    }

    result = responseObject.object;
    parsedResponse = Utils.parseResponse(result);
    var maskedResponse = Utils.getLoggableRequestAWP(result);
    Logger.getLogger('worldpay').debug('3ds verification Response string : ' + maskedResponse);

    return {
        success: true,
        error: false,
        serviceresponse: parsedResponse,
        responseObject: responseObject
    };
}

/**
 * Service wrapper for Googele Pay Authorization
 * @param {Object} orderObj - current order object
 * @param {dw.order.PaymentInstrument} paymentInstrument - order payment instrument
 * @param {Object} preferences - worldpay site preferences
 * @return {Object} returns an JSON object
 */
function gpayServiceWrapper(orderObj, paymentInstrument, preferences) {
    var result; var parsedResponse;

    var request = LibCreateRequest.createAuthRequestGpay(orderObj, paymentInstrument, preferences);
    var requestHeader = { 'Content-Type': 'application/vnd.worldpay.payments-v6+json' };
    var responseObject = Utils.serviceCallAWP(request, requestHeader, preferences, WorldpayConstants.PAYMENT_SERVICE_ID, preferences.getAPIEndpoint('payments', 'authorization'));

    var handleResult = ServiceResponseHandler.validateServiceResponse(responseObject);
    if (handleResult && Object.prototype.hasOwnProperty.call(handleResult, 'error') && handleResult.error) {
        return handleResult;
    }

    result = responseObject.object;
    parsedResponse = Utils.parseResponse(result);
    var maskedResponse = Utils.getLoggableRequestAWP(result);
    Logger.getLogger('worldpay').debug('GPayAuthorizeRequestService Response string : ' + maskedResponse);

    return {
        success: true,
        serviceresponse: parsedResponse,
        responseObject: responseObject
    };
}

/**
 * Service wrapper CSC actions
 * @param {string} url - csc action url
 * @param {string} orderNumber - orderNumber
 * @param {integer} referenceAmount - referenceAmount
 * @param {string} currency - currency
 * @return {Object} returns an JSON object
 */
function cscPartialActions(url, orderNumber, referenceAmount, currency) {
    var result; var parsedResponse;
    var request = LibCreateRequest.createInitialRequestPartialActions(referenceAmount, currency);
    var requestHeader = { 'Content-Type': 'application/vnd.worldpay.payments-v6+json' };
    var responseObject = Utils.serviceCallPartialActions(request, requestHeader, WorldpayConstants.PAYMENT_SERVICE_ID, url, 'POST');

    var handleResult = ServiceResponseHandler.validateServiceResponse(responseObject);
    if (handleResult && Object.prototype.hasOwnProperty.call(handleResult, 'error') && handleResult.error) {
        return handleResult;
    }

    result = responseObject.object;
    parsedResponse = Utils.parseResponse(result);
    var maskedResponse = Utils.getLoggableRequestAWP(result);
    Logger.getLogger('worldpay').debug('cscPartialActions Response string : ' + maskedResponse);

    return {
        success: true,
        serviceresponse: parsedResponse,
        responseObject: responseObject
    };
}

/**
 * Service wrapper Verified Token
 * @param {string} sessionID - The session Identifier(href) for webCSDK
 * @param {string} wsdkname - reference name from webCSDK form
 * @param {Object} customerObject - Customer Object
 * @return {Object} returns an JSON object
 */
function ccVerifiedTokenRequestServiceAWP(sessionID, wsdkname, customerObject) {
    var result; var parsedResponse; var errorCode; var errorMessage; var conflictMsg;
    var verifiedTokenRequest = LibCreateRequest.createVerifiedTokenRequestCcAwp(sessionID, wsdkname, customerObject);
    if (!verifiedTokenRequest) {
        errorCode = Resource.msg('service.invalid.request', 'worldpay', null);
        errorMessage = Resource.msg('service.invalid.request.msg', 'worldpay', null);
        return {
            error: true,
            errorCode: errorCode,
            errorMessage: errorMessage
        };
    }
    var requestHeader = {
        'Content-Type': 'application/vnd.worldpay.verified-tokens-v2.hal+json',
        Accept: 'application/vnd.worldpay.verified-tokens-v2.hal+json'
    };
    var responseObject = Utils.serviceCallAWP(verifiedTokenRequest, requestHeader, null, WorldpayConstants.VERIFIED_TOKEN_SERVICE_ID);

    var handleResult = ServiceResponseHandler.validateServiceResponse(responseObject);
    if (handleResult && Object.prototype.hasOwnProperty.call(handleResult, 'error') && handleResult.errorCode === 409) {
        result = handleResult.errorMessage;
        conflictMsg = handleResult.conflictMsg;
    }
    if (handleResult && Object.prototype.hasOwnProperty.call(handleResult, 'error') && handleResult.error && handleResult.errorCode !== 409) {
        return handleResult;
    }
    // eslint-disable-next-line eqeqeq
    if (handleResult && handleResult.errorCode != '409') {
        result = responseObject.object;
    }
    parsedResponse = Utils.parseResponse(result);
    var maskedResponse = Utils.getLoggableRequestAWP(result);
    Logger.getLogger('worldpay').debug('CCVerifiedTokenRequestService Response string : ' + maskedResponse);

    return {
        error: false,
        errorCode: errorCode,
        serviceResponse: parsedResponse,
        responseObject: responseObject,
        conflictMsg: conflictMsg
    };
}

/**
 * Service wrapper for WebCSDK Authorization
 * @param {dw.order.Order} orderObj - Current users's Order
 * @param {dw.order.PaymentInstrument} paymentInstrument - payment instrument object
 * @param {Object} preferences - worldpay preferences
 * @param {Object} authentication3ds - 3ds authentication response data
 * @return {Object} returns an JSON objectAR
 */
function webCSDKAuth(orderObj, paymentInstrument, preferences, authentication3ds) {
    var result; var parsedResponse; var errorCode; var errorMessage;
    var order = LibCreateRequest.createAuthRequestWCSDK(orderObj, paymentInstrument, preferences, authentication3ds);
    if (!order) {
        errorCode = Resource.msg('service.invalid.request', 'worldpay', null);
        errorMessage = Resource.msg('service.invalid.request.msg', 'worldpay', null);
        return {
            error: true,
            errorCode: errorCode,
            errorMessage: errorMessage
        };
    }
    var requestHeader = { 'Content-Type': 'application/vnd.worldpay.payments-v6+json' };
    var responseObject = Utils.serviceCallAWP(order, requestHeader, preferences, WorldpayConstants.PAYMENT_SERVICE_ID, preferences.getAPIEndpoint('payments', 'authorization'));

    var handleResult = ServiceResponseHandler.validateServiceResponse(responseObject);
    if (handleResult && Object.prototype.hasOwnProperty.call(handleResult, 'error') && handleResult.error) {
        return handleResult;
    }

    result = responseObject.object;
    parsedResponse = Utils.parseResponse(result);
    var maskedResponse = Utils.getLoggableRequestAWP(result);
    Logger.getLogger('worldpay').debug('WebCheckoutSDK Authorization Response string : ' + maskedResponse);

    return {
        success: true,
        serviceresponse: parsedResponse,
        responseObject: responseObject
    };
}


/**
 * Service wrapper for Inquiry Token
 * @param {Object} token - token
 * @return {Object} returns Token Card details for the given Token Id
 */
function enquireToken(token) {
    var awpCCToken = token;
    var result;
    var parsedResponse;
    var requestHeader = {
        'Content-Type': 'application/vnd.worldpay.tokens-v2.hal+json',
        Accept: 'application/vnd.worldpay.tokens-v2.hal+json'
    };

    var responseObject = Utils.serviceCallWithURL(requestHeader, WorldpayConstants.PAYMENT_SERVICE_ID, awpCCToken, 'GET');

    var handleResult = ServiceResponseHandler.validateServiceResponse(responseObject);
    if (handleResult && Object.prototype.hasOwnProperty.call(handleResult, 'error') && handleResult.error) {
        return handleResult;
    }

    result = responseObject.object;
    parsedResponse = Utils.parseResponse(result);
    var maskedResponse = Utils.getLoggableRequestAWP(result);
    Logger.getLogger('worldpay').debug('Service Inquiry Token Response string : ' + maskedResponse);

    return {
        success: true,
        serviceresponse: parsedResponse,
        responseObject: responseObject
    };
}

/**
 * Service wrapper for update Token
 * @param {Object} tobeupdated - tobeupdated object
 * @param {string} tobeupdatedURL -updation URL
 * @return {Object} returns Token Card details for the given Token Id
 */
function updateToken(tobeupdated, tobeupdatedURL) {
    var result;
    var parsedResponse;
    var requestHeader = {
        'Content-Type': 'application/vnd.worldpay.tokens-v2.hal+json',
        Accept: 'application/vnd.worldpay.tokens-v2.hal+json'
    };

    var responseObject = Utils.serviceCallPartialActions(tobeupdated, requestHeader, WorldpayConstants.PAYMENT_SERVICE_ID, tobeupdatedURL, 'PUT');

    var handleResult = ServiceResponseHandler.validateServiceResponse(responseObject);
    if (handleResult && Object.prototype.hasOwnProperty.call(handleResult, 'error') && handleResult.error) {
        return handleResult;
    }

    result = responseObject.object;
    parsedResponse = Utils.parseResponse(result);
    Logger.getLogger('worldpay').debug('Update token service triggered successfully');

    return {
        success: true,
        serviceresponse: parsedResponse,
        responseObject: responseObject
    };
}

/** Exported functions * */
module.exports = {
    ccAuthorizeRequestServiceAWP: ccAuthorizeRequestServiceAWP,
    cscActions: cscActions,
    gpayServiceWrapper: gpayServiceWrapper,
    cscPartialActions: cscPartialActions,
    ccIntelligentTokenRequestServiceAWP: ccIntelligentTokenRequestServiceAWP,
    ccTokenRequestServiceAWP: ccTokenRequestServiceAWP,
    deleteToken: deleteToken,
    jwtTokenRequest: jwtTokenRequest,
    authenticationRequest3Ds: authenticationRequest3Ds,
    verificationRequest3ds: verificationRequest3ds,
    ccVerifiedTokenRequestServiceAWP: ccVerifiedTokenRequestServiceAWP,
    webCSDKAuth: webCSDKAuth,
    enquireToken: enquireToken,
    updateToken: updateToken
};
