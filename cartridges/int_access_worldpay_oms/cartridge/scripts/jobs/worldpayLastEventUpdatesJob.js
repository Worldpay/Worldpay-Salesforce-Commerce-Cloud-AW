var Logger = require('dw/system/Logger');
const OMS_API_ENDPOINT = '/services/apexrest/oms_worldpay/Worldpay-Notify';
const OMS_AUTH_SERVICE_ID = 'order.management.auth-RefArch';

/**
 * Makes the OAuth and API call to OMS REST API via service call and returns the response or null if not successfull
 * @param {Object} requestObj - Request JSON Object
 * @param {Object} requestHeader - request header
 * @param {string} serviceID - ID of service to be used
 * @param {string} serviceEndpoint - URL endpoint for auth service call
 * @param {string} instanceURL - URL endpoint for api service call
 * @param {string} requestMethod - request method for service call
 * @return {Object} return the result
 */
function serviceCallOMS(requestObj, requestHeader, serviceID, serviceEndpoint, instanceURL, requestMethod) {
    var ServiceRegistry = require('dw/svc/LocalServiceRegistry');
    var requestBody = JSON.stringify(requestObj);
    var service;
    var result;
    try {
        service = ServiceRegistry.createService(serviceID, {
            createRequest: function (svc, message) {
                if (!empty(requestHeader)) {
                    Object.keys(requestHeader).forEach(function (key) {
                        svc.addHeader(key, requestHeader[key]);
                    });
                }
                if (!empty(requestMethod)) {
                    svc.setRequestMethod(requestMethod);
                }
                return message;
            },
            parseResponse: function (svc, client) {
                return client.text;
            },
            mockCall: function () {
                return {
                    statusCode: 200,
                    statusMessage: 'Form post successful',
                    text: 'MOCK RESPONSE (" + svc.URL + ")'
                };
            }
        });
        if (serviceEndpoint) {
            if (empty(service.getCredentialID())) {
                service.credentialID = 'oms auth';
            }
            Logger.getLogger('worldpay').debug('SC Connector credential ID: {0}', service.getCredentialID());
            var svcCredential = service.getConfiguration().getCredential();
            if (empty(svcCredential.getUser()) || empty(svcCredential.getPassword())) {
                throw new Error('Service configuration requires valid client ID (Service username) and secret (Service password)');
            }
            service.setAuthentication('NONE');
            service.addHeader('Content-Type', 'application/x-www-form-urlencoded');
            service.addParam('grant_type', 'password');
            service.addParam('username', svcCredential.getUser());
            service.addParam('password', svcCredential.getPassword());
            service.addParam('client_id', svcCredential.custom.clientid);
            service.addParam('client_secret', svcCredential.custom.clientsecret);
        } else {
            service.setURL(instanceURL);
        }
        // Make the service call here
        result = service.call(requestBody);
        if (result == null || service == null || result.getStatus().equals('SERVICE_UNAVAILABLE')) {
            Logger.getLogger('worldpay').error('RESULT FROM OMS IS EMPTY ' + result + ' OR SERVICE IS EMPTY ' + service);
            return result;
        }
        return result;
    } catch (ex) {
        Logger.getLogger('worldpay').error('OMS SERVICE EXCEPTION: ' + ex);
        return null;
    }
}

/**
 * Makes API calls to OMS to update worldpay last event.
 * @param {*} authResult - OMS OAuth result
 * @param {*} orderNumber - orderNumber from request body
 * @param {*} worldpayLastEvent - worldpayLastEvent from request body
 * @param {*} serviceID - Service ID from BM
 * @param {*} requestMethod - GET/POST
 */
function inititateOmsApiCall(authResult, orderNumber, worldpayLastEvent, serviceID, requestMethod) {
    var accessToken = JSON.parse(authResult.object).access_token;
    var requestHeader = {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + accessToken
    };
    var instanceURL = JSON.parse(authResult.object).instance_url + OMS_API_ENDPOINT;
    var requestObj = {
        orderNumber: orderNumber,
        status: worldpayLastEvent
    };
    var result = serviceCallOMS(requestObj, requestHeader, serviceID, null, instanceURL, requestMethod);
    Logger.getLogger('worldpay').debug(result);
}

/**
 * Makes OAuth and API calls to OMS
 * @param {Object} requestBody - Contains orderNumber and worldpayLastEvent
 * @param {Object} fetchedOrder - Contains order object to be updated
 */
function omsUpdateServiceCall(requestBody, fetchedOrder) {
    var Transaction = require('dw/system/Transaction');
    var worldpayLastEvent = requestBody.worldpayLastEvent;
    var orderNumber = requestBody.orderNumber;
    var order = fetchedOrder;
    if (order) {
        Transaction.wrap(function () {
            order.custom.oms_worldpay__worldpayLastEvent = worldpayLastEvent;
            order.custom.omsUpdatePending = false;
        });
        var requestObj = null;
        var requestHeader = null;
        var instanceURL = null;
        var serviceID = OMS_AUTH_SERVICE_ID;
        var serviceEndpoint = 'auth';
        var requestMethod = 'POST';
        var authResult = serviceCallOMS(requestObj, requestHeader, serviceID, serviceEndpoint, instanceURL, requestMethod);
        if (authResult.object) {
            inititateOmsApiCall(authResult, orderNumber, worldpayLastEvent, serviceID, requestMethod);
        } else {
            Logger.getLogger('worldpay').error('OMS OAuth call FAILED');
        }
        return;
    }
    Logger.getLogger('worldpay').debug('Order not found while updating OMS WorldpayLastEvent : ' + orderNumber);
}

/**
 * Makes service call to OMS API
 */
function updateWorldpayLastEvent() {
    var util = require('dw/util');
    var modificationDate = new util.Calendar();
    modificationDate.add(util.Calendar.MILLISECOND, -60000);
    var type = 'Order';
    var queryString = 'lastModified<={' + 0 + '} AND custom.omsUpdatePending ={' + 1 + '}';
    var sortString = 'lastModified asc';
    var systemObject = require('dw/object/SystemObjectMgr');
    var searchResultIterator = systemObject.querySystemObjects(
        type, queryString, sortString, modificationDate.getTime(), true);
    if (searchResultIterator.getCount() > 0) {
        while (searchResultIterator.hasNext()) {
            var order = searchResultIterator.next();
            var req = {
                worldpayLastEvent: order.custom.WorldpayLastEvent,
                orderNumber: order.orderNo
            };
            // WorldpayJobs-UpdateOrderStatus
            omsUpdateServiceCall(req, order);
        }
    }
}

module.exports = {
    updateWorldpayLastEvent: updateWorldpayLastEvent
};
