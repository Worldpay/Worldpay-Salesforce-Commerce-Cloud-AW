'use strict';


const StringUtils = require('dw/util/StringUtils');
const helpers = require('*/cartridge/scripts/util/helpers');

const endpoints = {
    get: {
        orderStatus: 'services/apexrest/oms_worldpay/OrderManagement'
    },
    create: {
        // leverage this pattern as use cases evolve here
    },
    update: {
        // leverage this pattern as use cases evolve here
    }
};

/**
 * Inserts auth token into request header
 * @param {dw.svc.HTTPService} svc - svc
 * @param {string} endpoint - endpoint
 * @throws {Error} Throws error when no valid auth token is available (i.e.- service error, service down)
 */
function setAuthHeader(svc, endpoint) {
    var authToken = require('*/cartridge/scripts/Registry').authToken();
    var token = authToken.getValidToken();
    if (empty(token) || !token.access_token) {
        throw new Error('No auth token available!');
    }

    svc.setAuthentication('NONE');
    svc.addHeader('Authorization', 'Bearer ' + token.access_token);
    svc.setURL(StringUtils.format('{0}/{1}', token.instance_url, endpoint));
}

/**
 * Check if 401 due to expired token
 * @param {dw.net.HTTPClient} client - client
 * @returns {boolean} true if expired auth token - result
 */
function isValid401(client) {
    var is401 = (client.statusCode === 401);
    var isFailureFromBadToken = false;
    var authResHeader = client.getResponseHeader('WWW-Authenticate');

    if (is401 && authResHeader) {
        isFailureFromBadToken = /^Bearer\s.+?invalid_token/.test(authResHeader);
    }

    return isFailureFromBadToken;
}

/**
 * Check if response type is JSON
 * @param {dw.net.HTTPClient} client - client
 * @returns {boolean} - result
 */
function isResponseJSON(client) {
    var contentTypeHeader = client.getResponseHeader('Content-Type');
    return contentTypeHeader && contentTypeHeader.split(';')[0].toLowerCase() === 'application/json';
}

/**
 * Parses response JSON and wraps with an object containing additional helper properties
 * @param {dw.svc.HTTPService} svc - svc
 * @param {dw.net.HTTPClient} client - client
 * @returns {Object} result - result
 */
function parseResponse(svc, client) {
    var isJSON = isResponseJSON(client);
    var parsedBody = client.text;

    if (isJSON) {
        parsedBody = helpers.expandJSON(client.text, {});
    }

    return {
        isValidJSON: isJSON,
        isError: client.statusCode >= 400,
        isAuthError: isValid401(client),
        responseObj: parsedBody,
        errorText: client.errorText
    };
}

var createAndUpdateDefinition = {
    createRequest: function (svc, endpoint, modelObject) {
        setAuthHeader(svc, endpoint);
        svc.addHeader('Content-Type', 'application/json');
        return modelObject;
    },
    parseResponse: parseResponse,
    mockCall: function () {
        var obj = {
        };
        return {
            statusCode: 202,
            statusMessage: 'Accepted',
            text: JSON.stringify(obj)
        };
    }
};

var queryDefinition = {
    createRequest: function (svc, endpoint, queryString) {
        var query = encodeURIComponent(queryString).replace(/%20/g, '+');
        setAuthHeader(svc, endpoint);
        svc.setURL(StringUtils.format('{0}query/?q={1}', svc.getURL(), query));
        svc.addHeader('Content-Type', 'application/json');
        svc.setRequestMethod('GET');
    },
    parseResponse: parseResponse,
    mockCall: function () {
        var obj = {
        };
        return {
            statusCode: 200,
            statusMessage: 'Success',
            text: JSON.stringify(obj)
        };
    }
};

var getDefinition = {
    createRequest: function (svc, endpoint, id) {
        setAuthHeader(svc, endpoint);
        svc.setURL(StringUtils.format('{0}/{1}', svc.getURL(), id));
        svc.addHeader('Content-Type', 'application/json');
        svc.setRequestMethod('GET');
    },
    parseResponse: parseResponse,
    mockCall: function () {
        var obj = {
        };
        return {
            statusCode: 200,
            statusMessage: 'Success',
            text: JSON.stringify(obj)
        };
    }
};

module.exports = {
    endpoints: endpoints,
    definitions: {
        create: createAndUpdateDefinition,
        update: createAndUpdateDefinition,
        query: queryDefinition,
        get: getDefinition
    }
};
