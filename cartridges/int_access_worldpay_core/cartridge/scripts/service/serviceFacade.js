'use strict';

var libCreateRequest = require('*/cartridge/scripts/lib/libCreateRequest');
var Utils = require('*/cartridge/scripts/common/utils');
var Logger = require('dw/system/Logger');
var worldpayConstants = require('*/cartridge/scripts/common/worldpayConstants');
var serviceResponseHandler = require('*/cartridge/scripts/service/serviceResponseHandler');
var Resource = require('dw/web/Resource');
var Site = require('dw/system/Site');
var system = require('dw/system/System');
var previousCartridgeVersion = Site.getCurrent().getCustomPreferenceValue('previousCartridgeVersion');
var upgradeDates = Site.getCurrent().getCustomPreferenceValue('previousPluginUpgradeDates');
var merchantEntity = Site.getCurrent().getCustomPreferenceValue('merchantEntity');
var merchant = Site.getCurrent().getCustomPreferenceValue('AWPMerchantID');
var sfraVersion = Resource.msg('global.version.number', 'version', null);
var currentCartrideVersion = Resource.msg('Worldpay.version', 'version', null);
var cVersion; var previousUpgradeDates;
if (previousCartridgeVersion) {
    cVersion = previousCartridgeVersion.join(',');
}
if (upgradeDates) {
    previousUpgradeDates = upgradeDates.join(',');
}
var modeSupported = system.getCompatibilityMode();
var compMode = parseFloat(modeSupported) / 100;
var compatibilityMode = compMode.toString();

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
    var order = libCreateRequest.createInitialRequestCcAwp(orderObj, cvn, paymentInstrument, preferences, authentication3ds);
    if (session.privacy.riskProfile) {
        delete session.privacy.riskProfile;
    }
    if (!order) {
        errorCode = Resource.msg('service.invalid.request', 'worldpay', null);
        errorMessage = Resource.msg('service.invalid.request.msg', 'worldpay', null);
        return {
            error: true,
            errorCode: errorCode,
            errorMessage: errorMessage
        };
    }
    var requestHeader = { 'Content-Type': 'application/vnd.worldpay.payments-v6+json',
        'MERCHANT-ENTITY-REF': merchantEntity,
        'MERCHANT-ID': merchant,
        'SFRA-VERSION': sfraVersion,
        'SFRA-COMPATIBILITY-VERSION': compatibilityMode,
        'CURRENT-WORLDPAY-CARTRIDGE-VERSION': currentCartrideVersion,
        'WORLDPAY-CARTRIDGE-VERSION-USED-TILL-DATE': cVersion,
        'UPGRADE-DATES': previousUpgradeDates
    };
    Logger.getLogger('worldpay').debug('request' + JSON.stringify(requestHeader));
    var responseObject = Utils.serviceCallAWP(order, requestHeader, preferences, worldpayConstants.PAYMENT_SERVICE_ID, preferences.getAPIEndpoint('payments', 'authorization'));

    var handleResult = serviceResponseHandler.validateServiceResponse(responseObject);
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
    var tokenRequest = libCreateRequest.createIntelligentTokenRequestCcAwp(paymentInstrument, customer);
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
        Accept: 'application/vnd.worldpay.verified-tokens-v2.hal+json',
        'MERCHANT-ENTITY-REF': merchantEntity,
        'MERCHANT-ID': merchant,
        'SFRA-VERSION': sfraVersion,
        'SFRA-COMPATIBILITY-VERSION': compatibilityMode,
        'CURRENT-WORLDPAY-CARTRIDGE-VERSION': currentCartrideVersion,
        'WORLDPAY-CARTRIDGE-VERSION-USED-TILL-DATE': cVersion,
        'UPGRADE-DATES': previousUpgradeDates
    };
    Logger.getLogger('worldpay').debug('requestHeader' + JSON.stringify(requestHeader));
    var responseObject = Utils.serviceCallAWP(tokenRequest, requestHeader, preferences, worldpayConstants.VERIFIED_TOKEN_SERVICE_ID);
    var handleResult = serviceResponseHandler.validateServiceResponse(responseObject);
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
    var tokenRequest = libCreateRequest.createTokenRequestCcAwp(orderObj, paymentInstrument);
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
    var responseObject = Utils.serviceCallAWP(tokenRequest, requestHeader, preferences, worldpayConstants.TOKEN_SERVICE_ID);
    var handleResult = serviceResponseHandler.validateServiceResponse(responseObject);
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
        Accept: 'application/vnd.worldpay.tokens-v1.hal+json',
        'MERCHANT-ENTITY-REF': merchantEntity,
        'MERCHANT-ID': merchant,
        'SFRA-VERSION': sfraVersion,
        'SFRA-COMPATIBILITY-VERSION': compatibilityMode,
        'CURRENT-WORLDPAY-CARTRIDGE-VERSION': currentCartrideVersion,
        'WORLDPAY-CARTRIDGE-VERSION-USED-TILL-DATE': cVersion,
        'UPGRADE-DATES': previousUpgradeDates
    };
    Logger.getLogger('worldpay').debug('requestHeader' + JSON.stringify(requestHeader));
    responseObject = Utils.serviceCallWithURL(requestHeader, worldpayConstants.TOKEN_SERVICE_ID, cToken, 'DELETE');
    handleResult = serviceResponseHandler.validateServiceResponse(responseObject);
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
    var responseObject = Utils.serviceCallWithURL(requestHeader, worldpayConstants.PAYMENT_SERVICE_ID, url);

    var handleResult = serviceResponseHandler.validateServiceResponse(responseObject);
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
        JWTRequest = libCreateRequest.createJWTRequest(order, pi, preferences);
    } else if (pi.paymentMethod.equals('CREDIT_CARD') && ccSecurityModel === 'WEB_SDK') {
        JWTRequest = libCreateRequest.createJWTRequestForWCSDK(order, pi, preferences);
    }
    var requestHeader = {
        'Content-Type': 'application/vnd.worldpay.verifications.customers-v2.hal+json',
        Accept: 'application/vnd.worldpay.verifications.customers-v2.hal+json'
    };
    var responseObject = Utils.serviceCallAWP(JWTRequest, requestHeader, preferences, worldpayConstants.THREE_DS_SERVICE_ID,
        preferences.getAPIEndpoint('3ds', 'jwt'));

    var handleResult = serviceResponseHandler.validateServiceResponse(responseObject);
    if (handleResult && Object.prototype.hasOwnProperty.call(handleResult, 'error') && handleResult.error) {
        return handleResult;
    }

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
        request = libCreateRequest.create3DsRequest(orderObj, paymentInstrument, preferences, sessionID);
    } else if (paymentInstrument.paymentMethod.equals('CREDIT_CARD') && ccSecurityModel === 'WEB_SDK') {
        request = libCreateRequest.create3DsRequestWCSDK(orderObj, paymentInstrument, preferences, sessionID);
    }
    var requestHeader = {
        'Content-Type': 'application/vnd.worldpay.verifications.customers-v1.hal+json',
        Accept: 'application/vnd.worldpay.verifications.customers-v1.hal+json'
    };
    var responseObject = Utils.serviceCallAWP(request, requestHeader, preferences, worldpayConstants.THREE_DS_SERVICE_ID,
        preferences.getAPIEndpoint('3ds', 'authentication'));

    var handleResult = serviceResponseHandler.validateServiceResponse(responseObject);
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

    var request = libCreateRequest.create3DsVerificationRequest(orderNo, reference3ds);
    var requestHeader = {
        'Content-Type': 'application/vnd.worldpay.verifications.customers-v2.hal+json',
        Accept: 'application/vnd.worldpay.verifications.customers-v2.hal+json',
        'MERCHANT-ENTITY-REF': merchantEntity,
        'MERCHANT-ID': merchant,
        'SFRA-VERSION': sfraVersion,
        'SFRA-COMPATIBILITY-VERSION': compatibilityMode,
        'CURRENT-WORLDPAY-CARTRIDGE-VERSION': currentCartrideVersion,
        'WORLDPAY-CARTRIDGE-VERSION-USED-TILL-DATE': cVersion,
        'UPGRADE-DATES': previousUpgradeDates
    };
    Logger.getLogger('worldpay').debug('requestHeader' + JSON.stringify(requestHeader));
    var responseObject = Utils.serviceCallAWP(request, requestHeader, preferences, worldpayConstants.THREE_DS_SERVICE_ID,
        preferences.getAPIEndpoint('3ds', 'verification'));

    var handleResult = serviceResponseHandler.validateServiceResponse(responseObject);
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
    var gPayMerchantID = Site.getCurrent().getCustomPreferenceValue('AWPGooglePayMerchantID');
    var request = libCreateRequest.createAuthRequestGpay(orderObj, paymentInstrument, preferences);
    var requestHeader = { 'Content-Type': 'application/vnd.worldpay.payments-v6+json',
        'MERCHANT-ENTITY-REF': merchantEntity,
        'MERCHANT-ID': gPayMerchantID,
        'SFRA-VERSION': sfraVersion,
        'SFRA-COMPATIBILITY-VERSION': compatibilityMode,
        'CURRENT-WORLDPAY-CARTRIDGE-VERSION': currentCartrideVersion,
        'WORLDPAY-CARTRIDGE-VERSION-USED-TILL-DATE': cVersion,
        'UPGRADE-DATES': previousUpgradeDates
    };
    Logger.getLogger('worldpay').debug('requestHeader' + JSON.stringify(requestHeader));
    var responseObject = Utils.serviceCallAWP(request, requestHeader, preferences, worldpayConstants.PAYMENT_SERVICE_ID, preferences.getAPIEndpoint('payments', 'authorization'));

    var handleResult = serviceResponseHandler.validateServiceResponse(responseObject);
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
    var request = libCreateRequest.createInitialRequestPartialActions(referenceAmount, currency);
    var requestHeader = { 'Content-Type': 'application/vnd.worldpay.payments-v6+json',
        'MERCHANT-ENTITY-REF': merchantEntity,
        'MERCHANT-ID': merchant,
        'SFRA-VERSION': sfraVersion,
        'SFRA-COMPATIBILITY-VERSION': compatibilityMode,
        'CURRENT-WORLDPAY-CARTRIDGE-VERSION': currentCartrideVersion,
        'WORLDPAY-CARTRIDGE-VERSION-USED-TILL-DATE': cVersion,
        'UPGRADE-DATES': previousUpgradeDates
    };
    Logger.getLogger('worldpay').debug('requestHeader' + JSON.stringify(requestHeader));
    var responseObject = Utils.serviceCallPartialActions(request, requestHeader, worldpayConstants.PAYMENT_SERVICE_ID, url, 'POST');

    var handleResult = serviceResponseHandler.validateServiceResponse(responseObject);
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
    var verifiedTokenRequest = libCreateRequest.createVerifiedTokenRequestCcAwp(sessionID, wsdkname, customerObject);
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
        Accept: 'application/vnd.worldpay.verified-tokens-v2.hal+json',
        'MERCHANT-ENTITY-REF': merchantEntity,
        'MERCHANT-ID': merchant,
        'SFRA-VERSION': sfraVersion,
        'SFRA-COMPATIBILITY-VERSION': compatibilityMode,
        'CURRENT-WORLDPAY-CARTRIDGE-VERSION': currentCartrideVersion,
        'WORLDPAY-CARTRIDGE-VERSION-USED-TILL-DATE': cVersion,
        'UPGRADE-DATES': previousUpgradeDates
    };
    Logger.getLogger('worldpay').debug('requestHeader' + JSON.stringify(requestHeader));
    var responseObject = Utils.serviceCallAWP(verifiedTokenRequest, requestHeader, null, worldpayConstants.VERIFIED_TOKEN_SERVICE_ID);

    var handleResult = serviceResponseHandler.validateServiceResponse(responseObject);
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
 * Verify Token call - Direct
 * @param {string} cardHolderName The card holder name
 * @param {Object} customerObject Customer Details
 * @param {string} cvn Security Number
 * @param {Object} pi Payment Instrument
 * @returns {Object} verified token response
 */
function ccVerifiedTokenRequestServiceAWPDirect(cardHolderName, customerObject, cvn, pi) {
    var result; var parsedResponse; var errorCode; var errorMessage; var conflictMsg;
    var verifiedTokenRequest = libCreateRequest.createVerifiedTokenRequestCcAwpDirect(cardHolderName, customerObject, cvn, pi);
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
        Accept: 'application/vnd.worldpay.verified-tokens-v2.hal+json',
        'MERCHANT-ENTITY-REF': merchantEntity,
        'MERCHANT-ID': merchant,
        'SFRA-VERSION': sfraVersion,
        'SFRA-COMPATIBILITY-VERSION': compatibilityMode,
        'CURRENT-WORLDPAY-CARTRIDGE-VERSION': currentCartrideVersion,
        'WORLDPAY-CARTRIDGE-VERSION-USED-TILL-DATE': cVersion,
        'UPGRADE-DATES': previousUpgradeDates
    };
    Logger.getLogger('worldpay').debug('requestHeader' + JSON.stringify(requestHeader));
    var responseObject = Utils.serviceCallAWP(verifiedTokenRequest, requestHeader, null, worldpayConstants.VERIFIED_TOKEN_SERVICE_ID);

    var handleResult = serviceResponseHandler.validateServiceResponse(responseObject);
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
    Logger.getLogger('worldpay').debug('ccVerifiedTokenRequestService Response string : ' + maskedResponse);

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
    var order = libCreateRequest.createAuthRequestWCSDK(orderObj, paymentInstrument, preferences, authentication3ds);
    if (session.privacy.riskProfile) {
        delete session.privacy.riskProfile;
    }
    if (!order) {
        errorCode = Resource.msg('service.invalid.request', 'worldpay', null);
        errorMessage = Resource.msg('service.invalid.request.msg', 'worldpay', null);
        return {
            error: true,
            errorCode: errorCode,
            errorMessage: errorMessage
        };
    }
    var requestHeader = { 'Content-Type': 'application/vnd.worldpay.payments-v6+json',
        'MERCHANT-ENTITY-REF': merchantEntity,
        'MERCHANT-ID': merchant,
        'SFRA-VERSION': sfraVersion,
        'SFRA-COMPATIBILITY-VERSION': compatibilityMode,
        'CURRENT-WORLDPAY-CARTRIDGE-VERSION': currentCartrideVersion,
        'WORLDPAY-CARTRIDGE-VERSION-USED-TILL-DATE': cVersion,
        'UPGRADE-DATES': previousUpgradeDates
    };
    var responseObject = Utils.serviceCallAWP(order, requestHeader, preferences, worldpayConstants.PAYMENT_SERVICE_ID, preferences.getAPIEndpoint('payments', 'authorization'));

    var handleResult = serviceResponseHandler.validateServiceResponse(responseObject);
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
 * Service wrapper for WebCSDK + CVV Authorization
 * @param {dw.order.Order} orderObj - Current users's Order
 * @param {dw.order.PaymentInstrument} paymentInstrument - payment instrument object
 * @param {Object} preferences - worldpay preferences
 * @param {Object} authentication3ds - 3ds authentication response data
 * @return {Object} returns an JSON objectAR
 */
function webCSDKCVVCheckoutAuth(orderObj, paymentInstrument, preferences, authentication3ds) {
    var result; var parsedResponse; var errorCode; var errorMessage;
    var order = libCreateRequest.createCVVAuthRequestWCSDK(orderObj, paymentInstrument, preferences, authentication3ds);
    if (session.privacy.riskProfile) {
        delete session.privacy.riskProfile;
    }
    if (!order) {
        errorCode = Resource.msg('service.invalid.request', 'worldpay', null);
        errorMessage = Resource.msg('service.invalid.request.msg', 'worldpay', null);
        return {
            error: true,
            errorCode: errorCode,
            errorMessage: errorMessage
        };
    }
    var requestHeader = { 'Content-Type': 'application/vnd.worldpay.payments-v6+json',
        'MERCHANT-ENTITY-REF': merchantEntity,
        'MERCHANT-ID': merchant,
        'SFRA-VERSION': sfraVersion,
        'SFRA-COMPATIBILITY-VERSION': compatibilityMode,
        'CURRENT-WORLDPAY-CARTRIDGE-VERSION': currentCartrideVersion,
        'WORLDPAY-CARTRIDGE-VERSION-USED-TILL-DATE': cVersion,
        'UPGRADE-DATES': previousUpgradeDates
    };
    Logger.getLogger('worldpay').debug('requestHeader' + JSON.stringify(requestHeader));
    var responseObject = Utils.serviceCallAWP(order, requestHeader, preferences, worldpayConstants.PAYMENT_SERVICE_ID, preferences.getAPIEndpoint('payments', 'migrateCardOnFileAuthorize'));

    var handleResult = serviceResponseHandler.validateServiceResponse(responseObject);
    if (handleResult && Object.prototype.hasOwnProperty.call(handleResult, 'error') && handleResult.error) {
        return handleResult;
    }

    result = responseObject.object;
    parsedResponse = Utils.parseResponse(result);
    var maskedResponse = Utils.getLoggableRequestAWP(result);
    Logger.getLogger('worldpay').debug('WebCheckoutSDK CVV Authorization Response string : ' + maskedResponse);

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
        Accept: 'application/vnd.worldpay.tokens-v2.hal+json',
        'MERCHANT-ENTITY-REF': merchantEntity,
        'MERCHANT-ID': merchant,
        'SFRA-VERSION': sfraVersion,
        'SFRA-COMPATIBILITY-VERSION': compatibilityMode,
        'CURRENT-WORLDPAY-CARTRIDGE-VERSION': currentCartrideVersion,
        'WORLDPAY-CARTRIDGE-VERSION-USED-TILL-DATE': cVersion,
        'UPGRADE-DATES': previousUpgradeDates
    };
    Logger.getLogger('worldpay').debug('requestHeader' + JSON.stringify(requestHeader));
    var responseObject = Utils.serviceCallWithURL(requestHeader, worldpayConstants.PAYMENT_SERVICE_ID, awpCCToken, 'GET');

    var handleResult = serviceResponseHandler.validateServiceResponse(responseObject);
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
        Accept: 'application/vnd.worldpay.tokens-v2.hal+json',
        'MERCHANT-ENTITY-REF': merchantEntity,
        'MERCHANT-ID': merchant,
        'SFRA-VERSION': sfraVersion,
        'SFRA-COMPATIBILITY-VERSION': compatibilityMode,
        'CURRENT-WORLDPAY-CARTRIDGE-VERSION': currentCartrideVersion,
        'WORLDPAY-CARTRIDGE-VERSION-USED-TILL-DATE': cVersion,
        'UPGRADE-DATES': previousUpgradeDates
    };
    Logger.getLogger('worldpay').debug('requestHeader' + JSON.stringify(requestHeader));
    var responseObject = Utils.serviceCallPartialActions(tobeupdated, requestHeader, worldpayConstants.PAYMENT_SERVICE_ID, tobeupdatedURL, 'PUT');

    var handleResult = serviceResponseHandler.validateServiceResponse(responseObject);
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

/**
 * Service wrapper for update token from my account
 * @param {string} tobeupdatedURL -updation URL
 * @return {Object} returns Token Card details for the given Token Id
 */
function updateTokenDetails(tobeupdatedURL) {
    var result;
    var parsedResponse;
    var requestHeader = {
        'Content-Type': 'application/vnd.worldpay.tokens-v2.hal+json',
        Accept: 'application/vnd.worldpay.tokens-v2.hal+json',
        'MERCHANT-ENTITY-REF': merchantEntity,
        'MERCHANT-ID': merchant,
        'SFRA-VERSION': sfraVersion,
        'SFRA-COMPATIBILITY-VERSION': compatibilityMode,
        'CURRENT-WORLDPAY-CARTRIDGE-VERSION': currentCartrideVersion,
        'WORLDPAY-CARTRIDGE-VERSION-USED-TILL-DATE': cVersion,
        'UPGRADE-DATES': previousUpgradeDates
    };
    Logger.getLogger('worldpay').debug('requestHeader' + JSON.stringify(requestHeader));
    var responseObject = Utils.updateTokenServiceCall(requestHeader, worldpayConstants.PAYMENT_SERVICE_ID, tobeupdatedURL, 'PUT');
    var handleResult = serviceResponseHandler.validateServiceResponse(responseObject);
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

/**
 *  * Service wrapper for Credit Card Exemption Engine Access Worldpay
 * @param {Object} orderObj - Order object
 * @param {dw.order.PaymentInstrument} paymentInstrument - paymentInstrument for which token will be created
 * @param {Object} preferences - Object containing AWP site preferences
 * @param {string} tokenUrl verified token URL
 * @returns {Object} returns an JSON object
 */
function validateOrderExemption(orderObj, paymentInstrument, preferences) {
    var result; var parsedResponse; var errorCode; var errorMessage;
    var order = libCreateRequest.createOrderExemptionRequest(orderObj, paymentInstrument, preferences);
    if (!order) {
        errorCode = Resource.msg('service.invalid.request', 'worldpay', null);
        errorMessage = Resource.msg('service.invalid.request.msg', 'worldpay', null);
        return {
            error: true,
            errorCode: errorCode,
            errorMessage: errorMessage
        };
    }
    var requestHeader = { 'Content-Type': 'application/vnd.worldpay.exemptions-v1.hal+json',
        Accept: 'application/vnd.worldpay.exemptions-v1.hal+json',
        'MERCHANT-ENTITY-REF': merchantEntity,
        'MERCHANT-ID': merchant,
        'SFRA-VERSION': sfraVersion,
        'SFRA-COMPATIBILITY-VERSION': compatibilityMode,
        'CURRENT-WORLDPAY-CARTRIDGE-VERSION': currentCartrideVersion,
        'WORLDPAY-CARTRIDGE-VERSION-USED-TILL-DATE': cVersion,
        'UPGRADE-DATES': previousUpgradeDates
    };

    var responseObject = Utils.serviceCallAWP(order, requestHeader, preferences, worldpayConstants.EXEMPTION_SERVICE_ID, preferences.getAPIEndpoint('exemption', 'assessment'));
    var handleResult = serviceResponseHandler.validateServiceResponse(responseObject);
    if (handleResult && Object.prototype.hasOwnProperty.call(handleResult, 'error') && handleResult.error) {
        return handleResult;
    }

    result = responseObject.object;
    parsedResponse = Utils.parseResponse(result);
    var maskedResponse = Utils.getLoggableRequestAWP(result);
    Logger.getLogger('worldpay').debug('Order Exemption Engine service triggered successfully and the response is: ' + maskedResponse);

    return {
        success: true,
        serviceresponse: parsedResponse,
        responseObject: responseObject
    };
}

/**
 * Service wrapper for ACH Pay Authorization
 * @param {Object} orderObj - current order object
 * @param {dw.order.PaymentInstrument} paymentInstrument - order payment instrument
 * @param {Object} preferences - worldpay site preferences
 * @return {Object} returns JSON object
 */
function achpayServiceWrapper(orderObj, paymentInstrument, preferences) {
    var result; var parsedResponse;
    var request = libCreateRequest.createRequestACHPay(orderObj, paymentInstrument, preferences);

    var requestHeader = { 'Content-Type': 'application/vnd.worldpay.pay-direct-v1+json',
        Accept: 'application/vnd.worldpay.pay-direct-v1+json',
        'MERCHANT-ENTITY-REF': merchantEntity,
        'MERCHANT-ID': merchant,
        'SFRA-VERSION': sfraVersion,
        'SFRA-COMPATIBILITY-VERSION': compatibilityMode,
        'CURRENT-WORLDPAY-CARTRIDGE-VERSION': currentCartrideVersion,
        'WORLDPAY-CARTRIDGE-VERSION-USED-TILL-DATE': cVersion,
        'UPGRADE-DATES': previousUpgradeDates
    };
    Logger.getLogger('worldpay').debug('requestHeader' + JSON.stringify(requestHeader));
    var responseObject = Utils.serviceCallAWP(request, requestHeader, preferences, worldpayConstants.PAYMENT_SERVICE_ID, preferences.getAPIEndpoint('payments', 'achpayDirectSale'));

    var handleResult = serviceResponseHandler.validateServiceResponse(responseObject);
    if (handleResult && Object.prototype.hasOwnProperty.call(handleResult, 'error') && handleResult.error) {
        return handleResult;
    }

    result = responseObject.object;
    parsedResponse = Utils.parseResponse(result);
    var maskedResponse = Utils.getLoggableRequestAWP(result);
    Logger.getLogger('worldpay').debug('ACH Pay AuthorizeRequestService Response string : : ' + maskedResponse);

    return {
        success: true,
        serviceresponse: parsedResponse,
        responseObject: responseObject
    };
}

/**
 * Service wrapper for VoidSale service
 * @param {dw.order.Order} orderObj - Current users's Order
 * @param {Object} paymentMthd - Current payment method
 * @return {Object} returns an JSON object
 */
function voidSaleService(orderObj) {
    var voidSaleUrl = orderObj.custom.achpayVoidSaleUrl;
    var result;
    var parsedResponse;
    var requestHeader = { 'Content-Type': 'application/vnd.worldpay.pay-direct-v1+json',
        Accept: 'application/vnd.worldpay.pay-direct-v1+json',
        'MERCHANT-ENTITY-REF': merchantEntity,
        'MERCHANT-ID': merchant,
        'SFRA-VERSION': sfraVersion,
        'SFRA-COMPATIBILITY-VERSION': compatibilityMode,
        'CURRENT-WORLDPAY-CARTRIDGE-VERSION': currentCartrideVersion,
        'WORLDPAY-CARTRIDGE-VERSION-USED-TILL-DATE': cVersion,
        'UPGRADE-DATES': previousUpgradeDates
    };
    Logger.getLogger('worldpay').debug('requestHeader' + JSON.stringify(requestHeader));
    var responseObject = Utils.serviceCallWithURL(requestHeader, worldpayConstants.PAYMENT_SERVICE_ID, voidSaleUrl, 'POST');
    var handleResult = serviceResponseHandler.validateServiceResponse(responseObject);
    if (handleResult && Object.prototype.hasOwnProperty.call(handleResult, 'error') && handleResult.error) {
        return handleResult;
    }
    result = responseObject.object;
    parsedResponse = Utils.parseResponse(result);
    var maskedResponse = Utils.getLoggableRequestAWP(result);
    Logger.getLogger('worldpay').debug('ACH Pay Void sale service Inquiry Token Response string : ' + maskedResponse);

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
    updateToken: updateToken,
    updateTokenDetails: updateTokenDetails,
    ccVerifiedTokenRequestServiceAWPDirect: ccVerifiedTokenRequestServiceAWPDirect,
    webCSDKCVVCheckoutAuth: webCSDKCVVCheckoutAuth,
    validateOrderExemption: validateOrderExemption,
    achpayServiceWrapper: achpayServiceWrapper,
    voidSaleService: voidSaleService
};
