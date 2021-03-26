/**
 * This script provides utility functions shared across other
 * related scripts. Reused script components for request creation,
 * while this script is imported into the
 * requiring script.
 */

var Logger = require('dw/system/Logger');
var WorldpayConstants = require('*/cartridge/scripts/common/worldpayConstants');

/**
 * Fail the order.
 * @param {Object} order - order object
 * @param {string} errorMessage - message for failure
 * @return {Object} returns an json object
 */
function failImpl(order, errorMessage) {
    var OrderMgr = require('dw/order/OrderMgr');
    var Transaction = require('dw/system/Transaction');
    var orderstatus;
    Transaction.wrap(function () {
        if (order instanceof dw.order.Order) {
            orderstatus = OrderMgr.failOrder(order, true);
        } else {
            orderstatus = OrderMgr.failOrder(order.object, true);
        }
    });
    if (orderstatus && !orderstatus.isError()) {
        return {error: false};
    }
    return {error: true, errorMessage: errorMessage};
}

/**
 * Calculates the amount to be payed by a non-gift certificate payment instrument based
 * on the given order. The method subtracts the amount of all redeemed gift certificates
 * from the order total and returns this value.
 * @param {Object} order - order object
 * @return {number} return the amount
 */
function calculateNonGiftCertificateAmount(order) {
    var Money = require('dw/value/Money');
    // the total redemption amount of all gift certificate payment instruments in the order
    var giftCertTotal = new Money(0.0, order.currencyCode);

    // get the list of all gift certificate payment instruments
    var gcPaymentInstrs = order.getGiftCertificatePaymentInstruments();
    var iter = gcPaymentInstrs.iterator();
    var orderPI = null;

    // sum the total redemption amount
    while (iter.hasNext()) {
        orderPI = iter.next();
        giftCertTotal = giftCertTotal.add(orderPI.getPaymentTransaction().getAmount());
    }

    // get the order total
    var orderTotal = order.totalGrossPrice;

    // calculate the amount to charge for the payment instrument
    // this is the remaining open order total which has to be paid
    var amountOpen = orderTotal.subtract(giftCertTotal);

    // return the open amount
    return amountOpen;
}


/**
 * Sends the order JSON/request JSON to the server via service call and returns the answer or null if not successfull
 * @param {Object} requestObj - Request JSON Object
 * @param {Object} requestHeader - request header
 * @param {Object} preferences - preferences object
 * @param {String} serviceID - ID of service to be used
 * @param {String} serviceURL - URL endpoint for service call
 * @param {String} requestMethod - request method for service call
 * @return {Object} return the result
 */

function serviceCallAWP(requestObj, requestHeader, preferences, serviceID, serviceEndpoint, requestMethod) {
    var ServiceRegistry = require('dw/svc/LocalServiceRegistry');
    var Encoding = require('dw/crypto/Encoding');
    var Bytes = require('dw/util/Bytes');
    var orderJSONString = JSON.stringify(requestObj);
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
                filterLogMessage: function (message) {
                    var messgaeString = JSON.stringify(message);
                    var mapObj = [{regex: /cardNumber\\":\\".*?\\"/g, val: 'cardNumber\\" : \\"***\\"'},
                        {regex: /cardHolderName\\":\\".*?\\"/g, val: 'cardHolderName\\" : \\"***\\"'},
                        {regex: /month\\":[0-9]*,/g, val: 'month\\" : \\"***\\",'},
                        {regex: /year\\":..../g, val: 'year\\" : \\"***\\" '},
                        {regex: /cvc\\":\\"[0-9]*\\",/g, val: 'cvc\\" : \\"***\\",'},
                        {regex: /cvn\\":\\"[0-9]*\\",/g, val: 'cvn\\" : \\"***\\",'},
                        {regex: /email\\":\\".*?\\"/g, val: 'email\\" : \\"***\\"'},
                        {regex: /phoneNumber\\":\\".*?\\"/g, val: 'phoneNumber\\" : \\"***\\"'},
                        {regex: /jwt\\":\\".*?\\",/g, val: 'jwt\\" : \\"***\\",'},
                        {regex: /bin\\":\\".*?\\"/g, val: 'bin\\" : \\"***\\"'}
                    ];
                    mapObj.forEach(function (regex) {
                        messgaeString = messgaeString.replace(regex.regex, regex.val);
                    });
                    var parsedmessgaeString = JSON.parse(messgaeString);
                    return parsedmessgaeString;
                },
                mockCall: function () {
                    return {
                        statusCode: 200,
                        statusMessage: "Form post successful",
                        text: "MOCK RESPONSE (" + svc.URL + ")"
                    };
                }

            }
        );
        //Log masked sensitive data in custom debug log
        Logger.getLogger('worldpay').debug('Request: ' + getLoggableRequestAWP(orderJSONString));
        // When we need to log without masking in custom debug log
        //Logger.getLogger('worldpay').debug('Request: ' + orderJSONString);
        if (!empty(serviceEndpoint)) {
            service.setURL(service.getURL() + '/' + serviceEndpoint);
        }
        // Make the service call here
        result = service.call(orderJSONString);
        if (result == null || service == null || result.getStatus().equals('SERVICE_UNAVAILABLE')) {
            Logger.getLogger('worldpay').error('WORLDPAY RESULT IS EMPTY ' + result + ' OR SERVICE IS EMPTY ' + service);
            return result;
        }
        return result;
    } catch (ex) {
        Logger.getLogger('worldpay').error('WORLDPAY SERVICE EXCEPTION: ' + ex);
        return null;
    }
}

/**
 * Method identifies the sensitive data and prevents logging them.
 * @param {XML} requestXML - Request XML
 * @return {XML} return the XML
 */
function getLoggableRequestAWP(orderJSONString) {
    var messgaeString = JSON.stringify(orderJSONString);
    var mapObj = [{regex: /cardNumber\\":\\".*?\\"/g, val: 'cardNumber\\" : \\"***\\"'},
        {regex: /cardHolderName\\":\\".*?\\"/g, val: 'cardHolderName\\" : \\"***\\"'},
        {regex: /month\\":[0-9]*,/g, val: 'month\\" : \\"***\\",'},
        {regex: /year\\":..../g, val: 'year\\" : \\"***\\" '},
        {regex: /cvc\\":\\"[0-9]*\\",/g, val: 'cvc\\" : \\"***\\",'},
        {regex: /cvn\\":\\"[0-9]*\\",/g, val: 'cvn\\" : \\"***\\",'},
        {regex: /email\\":\\".*?\\"/g, val: 'email\\" : \\"***\\"'},
        {regex: /phoneNumber\\":\\".*?\\"/g, val: 'phoneNumber\\" : \\"***\\"'},
        {regex: /jwt\\" : \\".*?\\",/g, val: 'jwt\\" : \\"***\\",'},
        {regex: /bin\\" : \\".*?\\"/g, val: 'bin\\" : \\"***\\"'}
    ];
    mapObj.forEach(function (regex) {
        messgaeString = messgaeString.replace(regex.regex, regex.val);
    });
    var parsedmessgaeString = JSON.parse(messgaeString);
    return parsedmessgaeString;
}

// partial actions
function serviceCallPartialActions(request, requestHeader, serviceID, serviceURL, requestMethod) {
    var ServiceRegistry = require('dw/svc/LocalServiceRegistry');
    var Encoding = require('dw/crypto/Encoding');
    var Bytes = require('dw/util/Bytes');
    var orderJSONString = JSON.stringify(request);
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
                filterLogMessage: function (message) {
                    var messgaeString = JSON.stringify(message);

                    var parsedmessgaeString = JSON.parse(messgaeString);
                    return parsedmessgaeString;

                },
                mockCall: function () {
                    return {
                        statusCode: 200,
                        statusMessage: "Form post successful",
                        text: "MOCK RESPONSE (" + svc.URL + ")"
                    };
                }
            }
        );
        if (!empty(serviceURL)) {
            service.setURL(serviceURL);
        }
        // Make the service call here
        result = service.call(orderJSONString);
        if (result == null || service == null || result.getStatus().equals('SERVICE_UNAVAILABLE')) {
            Logger.getLogger('worldpay').error('WORLDPAY RESULT IS EMPTY ' + result + ' OR SERVICE IS EMPTY ' + service);
            return result;
        }
        return result;
    } catch (ex) {
        Logger.getLogger('worldpay').error('WORLDPAY SERVICE EXCEPTION: ' + ex);
        return null;
    }
}

function serviceCallWithURL(requestHeader, serviceID, serviceURL, requestMethod) {
    var ServiceRegistry = require('dw/svc/LocalServiceRegistry');
    var Encoding = require('dw/crypto/Encoding');
    var Bytes = require('dw/util/Bytes');
    var orderJSONString = '';
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
                filterLogMessage: function (message) {
                    var messgaeString = JSON.stringify(message);

                    var parsedmessgaeString = JSON.parse(messgaeString);
                    return parsedmessgaeString;

                },
                mockCall: function () {
                    return {
                        statusCode: 200,
                        statusMessage: "Form post successful",
                        text: "MOCK RESPONSE (" + svc.URL + ")"
                    };
                }

            }
        );
        Logger.getLogger('worldpay').debug('Request: ' + orderJSONString);
        if (!empty(serviceURL)) {
            service.setURL(serviceURL);
        }
        // Make the service call here
        result = service.call(orderJSONString);
        if (result == null || service == null || result.getStatus().equals('SERVICE_UNAVAILABLE')) {
            Logger.getLogger('worldpay').error('WORLDPAY RESULT IS EMPTY ' + result + ' OR SERVICE IS EMPTY ' + service);
            return result;
        }
        return result;
    } catch (ex) {
        Logger.getLogger('worldpay').error('WORLDPAY SERVICE EXCEPTION: ' + ex);
        return null;
    }
}

/**
 * Method identifies the error message based upon the error code received in the response.
 * @param {string} errorCode - error Code
 * @return {string} return the error message
 */
function getErrorMessage(errorCode) {
    var errorMessage = null;
    var errorProperty = 'worldpay.error.code' + errorCode;
    var Resource = require('dw/web/Resource');
    errorMessage = Resource.msgf(errorProperty, 'worldpayerror', null);

    // Generic Error Message set when ErrorCode is empty or ErrorCode is not valid.
    if (!errorCode) {
        errorMessage = Resource.msgf('worldpay.error.generalerror', 'worldpayerror', null);
    }

    return errorMessage;
}


/**
 * Parses the server response
 * @param {string} inputString - input
 * @return {Object} return the response
 */
function parseResponse(inputString) {
    var ResponseData = require('*/cartridge/scripts/object/responseData');
    var responseData = new ResponseData();
    var response = responseData.parseJSON(inputString);
    if (!empty(response)) {
        return response;
    }
    Logger.getLogger('worldpay')
        .error('Error occured on parsing the JSON response:\n ');
    return null;
}

/**
 * Update transaction status in order custom attribute
 * @param {dw.order.LineItemCtnr} order - order object
 * @param {string} updatedStatus - updated status
 * @return {Object} returns an arraylist for status history object
 */
function updateTransactionStatus(order, updatedStatus) {
    var ArrayList = require('dw/util/ArrayList');
    var statusHist = order.custom.AWPtransactionStatus;
    var COtimeStamp = new Date();
    var statusList;
    if (statusHist == null && statusHist.length < 0) {
        statusList = new ArrayList();
    } else {
        statusList = new ArrayList(statusHist);
    }

    statusList.addAt(0, updatedStatus + ':' + COtimeStamp);
    return statusList;
}

/**
 * Add custom object entry for order notification received
 * @param {string} JSONString - JSON arrived for custom object notification
 * @return {Object} returns an JSON object
 */
function addNotifyCustomObjectAWP(JSONString) {
    var content;
    var errorCode;
    var errorMessage;
    try {
        content = JSON.parse(JSONString);
    } catch (ex) {
        errorCode = WorldpayConstants.NOTIFYERRORCODE111;
        errorMessage = getErrorMessage(errorCode);
        Logger.getLogger('worldpay').error('Order Notification : Add Custom Object : ' + errorCode + ' : ' + errorMessage + '  : ' + JSONString + '  : ' + ex);
        return {error: true, errorCode: errorCode, errorMessage: errorMessage, JSONString: JSONString};
    }

    var orderCode;
    try {
        if (content) {
            var temp = content;
            if ('transactionReference' in temp.eventDetails) {
                orderCode = temp.eventDetails.transactionReference.toString();
            } else {
                errorCode = WorldpayConstants.NOTIFYERRORCODE112;
                errorMessage = getErrorMessage(errorCode);
                Logger.getLogger('worldpay').error('Order Notification : Add Custom Object : ' + errorCode + ' : ' + errorMessage + '  : ' + JSONString);
            }
        } else {
            errorCode = WorldpayConstants.NOTIFYERRORCODE112;
            errorMessage = getErrorMessage(errorCode);
            Logger.getLogger('worldpay').error('Order Notification : Add Custom Object : ' + errorCode + ' : ' + errorMessage + '  : ' + JSONString);
        }
    } catch (ex) {
        errorCode = WorldpayConstants.NOTIFYERRORCODE111;
        errorMessage = getErrorMessage(errorCode);
        Logger.getLogger('worldpay').error('Order Notification : Add Custom Object : ' + errorCode + ' : ' + errorMessage + '  : ' + JSONString + '  : ' + ex);
        return {error: true, errorCode: errorCode, errorMessage: errorMessage, JSONString: JSONString};
    }

    try {
        var CustomObjectMgr = require('dw/object/CustomObjectMgr');
        var COA;
        var UUIDUtils = require('dw/util/UUIDUtils');
        var uuid = UUIDUtils.createUUID();
        var Transaction = require('dw/system/Transaction');
        Transaction.wrap(function () {
            COA = CustomObjectMgr.createCustomObject('OrderNotifyUpdatesForAWP', uuid);
            COA.custom.JSONString = JSONString;
            COA.custom.timeStamp = new Date();
            COA.custom.orderNo = orderCode;
        });
        return {success: true};
    } catch (e) {
        errorCode = WorldpayConstants.NOTIFYERRORCODE111;
        errorMessage = getErrorMessage(errorCode);
        Logger.getLogger('worldpay').error('Order Notification : Add Custom Object : ' + errorCode + ' : ' + errorMessage + '  : ' + JSONString + '  : ' + e);
        return {error: true, errorCode: errorCode, errorMessage: errorMessage, JSONString: JSONString};
    }
}

/**
 * Validate IP Address range
 * @param {string} requestRemoteAddress - remote IP address of request
 * @return {Object} returns an json object
 */
function validateIP(requestRemoteAddress) {
    var Site = require('dw/system/Site');
    if (Site.getCurrent().preferences.custom.WorldpayNotificationIPAddressesStart
        && Site.getCurrent().preferences.custom.WorldpayNotificationIPAddressesEnd) {
        var currentIPAddress = requestRemoteAddress;
        while (currentIPAddress.indexOf('.') > -1) {
            currentIPAddress = currentIPAddress.replace('.', '');
        }
        var start = Number(Site.getCurrent().getCustomPreferenceValue('WorldpayNotificationIPAddressesStart'));
        var end = Number(Site.getCurrent().getCustomPreferenceValue('WorldpayNotificationIPAddressesEnd'));
        if (Number(currentIPAddress) >= start &&
            Number(currentIPAddress) <= end) {
            return {success: true, error: false};
        }
        Logger.getLogger('worldpay').error('ValidateIP : start : ' + start + ' end: ' + end + ' currentIPAddress: ' + currentIPAddress);
    }
    return {error: true};
}

function calculateNonGiftCertificateAmountFromBasket(lineItemCtnr) {
    var totalAmount;
    var Money = require('dw/value/Money');
    if (lineItemCtnr.totalGrossPrice.available) {
        totalAmount = lineItemCtnr.totalGrossPrice;
    } else {
        totalAmount = lineItemCtnr.adjustedMerchandizeTotalPrice;
    }
    var giftCertTotal = new Money(0.0, lineItemCtnr.currencyCode);
    var gcPaymentInstrs = lineItemCtnr.getGiftCertificatePaymentInstruments();
    var iter = gcPaymentInstrs.iterator();
    var orderPI = null;
    while (iter.hasNext()) {
        orderPI = iter.next();
        giftCertTotal = giftCertTotal.add(orderPI.getPaymentTransaction().getAmount());
    }
    var orderTotal = totalAmount;
    var amountOpen = orderTotal.subtract(giftCertTotal);
    return amountOpen;
}

/**
 * Get credit card payment instrument
 * @param {dw.order.LineItemCtnr} order - order object
 * @return {dw.order.OrderPaymentInstrument} returns an paymentIntrument object
 */
function getPaymentInstrument(order) {
    var PaymentInstrument = require('dw/order/PaymentInstrument');
    var paymentInstruments = order.getPaymentInstruments(PaymentInstrument.METHOD_CREDIT_CARD);
    var paymentIterator = paymentInstruments.iterator();
    var paymentIntrument;
    while (paymentIterator.hasNext()) {
        var pi = paymentIterator.next();
        if (pi.paymentMethod.equals(PaymentInstrument.METHOD_CREDIT_CARD)) {
            paymentIntrument = pi;
        }
    }

    return paymentIntrument;
}

/** Exported functions **/
module.exports = {
    failImpl: failImpl,
    validateIP: validateIP,
    calculateNonGiftCertificateAmount: calculateNonGiftCertificateAmount,
    calculateNonGiftCertificateAmountFromBasket: calculateNonGiftCertificateAmountFromBasket,
    serviceCallAWP: serviceCallAWP,
    getErrorMessage: getErrorMessage,
    serviceCallPartialActions: serviceCallPartialActions,
    parseResponse: parseResponse,
    serviceCallWithURL: serviceCallWithURL,
    updateTransactionStatus: updateTransactionStatus,
    addNotifyCustomObjectAWP: addNotifyCustomObjectAWP,
    getPaymentInstrument: getPaymentInstrument,
    getLoggableRequestAWP: getLoggableRequestAWP
};
