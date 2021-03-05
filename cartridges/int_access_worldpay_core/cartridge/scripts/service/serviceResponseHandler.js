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

    if (!responseObject) {
        errorCode = 'RESPONSE_EMPTY';
        errorMessage = Utils.getErrorMessage('servererror');
        return {
            error: true,
            errorCode: errorCode,
            errorMessage: errorMessage
        };
    } else if ('status' in responseObject && responseObject.getStatus().equals('SERVICE_UNAVAILABLE')) {
        errorCode = 'SERVICE_UNAVAILABLE';
        errorMessage = Utils.getErrorMessage('servererror');
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
        return {
            error: true,
            errorCode: errorCode,
            errorMessage: errorMessage,
            conflictMsg: conflictMsg
        };
    } else if (
        'status' in responseObject && responseObject.getStatus().equals('ERROR')
    ) {
        errorCode = 'ERROR';
        errorMessage = Utils.getErrorMessage('servererror');
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
