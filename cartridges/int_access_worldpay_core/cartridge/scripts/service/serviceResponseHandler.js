'use strict';

/**
 *  Parsese and validates the service response
 * @param {Object} responseObject - Service Response
 * @returns {Object} - returns json object
 */
function validateServiceResponse(responseObject) {
    var Utils = require('*/cartridge/scripts/common/utils');
    var errorCode = '';
    var errorMessage = '';
    var conflictMsg = '';
    var errorKey = '';
    var Logger = require('dw/system/Logger');
    var errorObject;
    if (!responseObject) {
        errorCode = 'RESPONSE_EMPTY';
        errorMessage = Utils.getConfiguredLabel('worldpay.error.codeservererror', 'worldpayError');
        Logger.getLogger('worldpay').error('ErrorOccured : errorCode =' + errorCode + ' errorMessage =' + errorMessage);
        return {
            error: true,
            errorCode: errorCode,
            errorMessage: errorMessage
        };
    } else if ('status' in responseObject && responseObject.getStatus().equals('SERVICE_UNAVAILABLE')) {
        errorCode = 'SERVICE_UNAVAILABLE';
        errorMessage = Utils.getErrorMessage('servererror');
        Logger.getLogger('worldpay').error('ErrorOccured : errorCode =' + errorCode + ' errorMessage =' + errorMessage);
        return {
            error: true,
            errorCode: errorCode,
            errorMessage: errorMessage
        };
    } else if (
        'status' in responseObject && responseObject.getStatus().equals('ERROR') && responseObject.msg === 'Conflict'
    ) {
        errorCode = responseObject.error;
        errorMessage = responseObject.errorMessage;
        conflictMsg = responseObject.msg;
        Logger.getLogger('worldpay').error('ErrorOccured : errorCode =' + errorCode + ' errorMessage =' + errorMessage);
        return {
            error: true,
            errorCode: errorCode,
            errorMessage: errorMessage,
            conflictMsg: conflictMsg
        };
    } else if ('status' in responseObject && responseObject.getStatus().equals('ERROR')) {
        Logger.getLogger('worldpay').debug('Response Object : ' + responseObject);
        if (responseObject.getErrorMessage()) {
            errorObject = JSON.parse(responseObject.getErrorMessage());
        }
        errorKey = 'worldpay.error.codeservererror';
        errorCode = 'ERROR';
        if (errorObject && (errorObject.errorName || errorObject.message)) {
            if (errorObject.errorName.equals('fieldHasInvalidValue') && (errorObject.message.indexOf('CVC') > -1)) {
                errorKey = 'worldpay.error.codecvverror';
                errorCode = 'cvverror';
                errorMessage = errorObject.message;
                Logger.getLogger('worldpay').debug('ErrorOccured : Setting errorCode =' + errorCode + ' errorMessage =' + errorMessage);
            } else if (errorObject.errorName.equals('bodyDoesNotMatchSchema') && responseObject.errorMessage && responseObject.errorMessage.indexOf('Narrative') > -1) {
                errorKey = 'narrativeERROR';
                errorCode = 'narrativeERROR';
                errorMessage = responseObject.errorMessage;
                Logger.getLogger('worldpay').debug('ErrorOccured : Setting errorCode =' + errorCode + ' errorMessage =' + errorMessage);
            } else if (errorObject.errorName.equals('entityIsNotConfigured')) {
                errorKey = 'entityERROR';
                errorCode = 'entityERROR';
                errorMessage = responseObject.errorMessage;
                Logger.getLogger('worldpay').debug('ErrorOccured : Setting errorCode =' + errorCode + ' errorMessage =' + errorMessage);
            } else if (errorObject.message.indexOf('validationErrors') > -1) {
                errorKey = 'validationError';
                errorMessage = responseObject.errorMessage;
                errorCode = 'validationError';
                Logger.getLogger('worldpay').debug('ErrorOccured : Setting errorCode =' + errorCode + ' errorMessage =' + errorMessage);
            }
        }
        errorMessage = Utils.getConfiguredLabel(errorKey, 'worldpayError');
        Logger.getLogger('worldpay').error('ErrorOccured : errorCode =' + errorCode + ' errorMessage =' + errorMessage + ' errorObject =' + errorObject);
        return {
            error: true,
            errorCode: errorCode,
            errorMessage: errorMessage
        };
    }

    // Parsing the Worldpay service object for deep validations
    var result = responseObject.object;
    var parsedResponse = Utils.parseResponse(result);
    if (parsedResponse && parsedResponse.isError()) {
        errorCode = parsedResponse.getErrorCode();
        errorMessage = parsedResponse.getErrorMessage();
        return {
            error: true,
            errorCode: errorCode,
            errorMessage: errorMessage
        };
    }
    return {
        error: false
    };
}

module.exports = {
    validateServiceResponse: validateServiceResponse
};
