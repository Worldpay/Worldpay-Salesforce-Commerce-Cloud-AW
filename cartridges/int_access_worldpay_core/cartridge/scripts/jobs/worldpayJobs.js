'use strict';

var Transaction = require('dw/system/Transaction');
var OrderManager = require('dw/order/OrderMgr');
var UpdateOrderStatus = require('*/cartridge/scripts/order/updateOrderStatus');

/**
 * Updates the status of order
 * @param {number} order - Current users's order
 * @param {string} serviceResponseLastEvent - Update Status of the order
 * @param {Object} serviceResponse - Service Response
 * @return {boolean} returns true/false depending upon success
 */
function updateOrderStatus(order, serviceResponseLastEvent, serviceResponse) {
    var Resource = require('dw/web/Resource');
    var Order = require('dw/order/Order');
    var Logger = require('dw/system/Logger');
    var orderStatus = order.status.displayValue;
    var updateStatus = serviceResponseLastEvent;
    var status;
    var updateOrderStatusResult;
    if ('FAILED'.equalsIgnoreCase(orderStatus) && ('AUTHORIZED'.equalsIgnoreCase(updateStatus))) {
        OrderManager.undoFailOrder(order);
        OrderManager.placeOrder(order);
        orderStatus = order.status.displayValue;
    }
    if (Resource.msg('notification.paymentStatus.AUTHORISED', 'worldpay', null).equalsIgnoreCase(updateStatus)) {
        if (!('OPEN'.equalsIgnoreCase(orderStatus) || 'COMPLETED'.equalsIgnoreCase(orderStatus) || 'NEW'.equalsIgnoreCase(orderStatus))) {
            Transaction.wrap(function () {
                status = OrderManager.placeOrder(order);
            });
            if (status.isError()) {
                return false;
            }
        }
        Transaction.wrap(function () {
            updateOrderStatusResult = UpdateOrderStatus.updateOrderStatus(order, serviceResponse, updateStatus, null);
        });
        return updateOrderStatusResult.success;
    } else if (Resource.msg('notification.paymentStatus.REFUSED', 'worldpay', null).equalsIgnoreCase(updateStatus)) {
        if (!('CANCELLED'.equalsIgnoreCase(orderStatus) || 'FAILED'.equalsIgnoreCase(orderStatus))) {
            Transaction.wrap(function () {
                status = OrderManager.failOrder(order, true);
            });
            if (status.isError()) {
                return false;
            }
        }
        Transaction.wrap(function () {
            updateOrderStatusResult = UpdateOrderStatus.updateOrderStatus(order, serviceResponse, updateStatus, null);
        });
        return updateOrderStatusResult.success;
    } else if (Resource.msg('notification.paymentStatus.CANCELLED', 'worldpay', null).equalsIgnoreCase(updateStatus)) {
        if ('CANCELLED'.equalsIgnoreCase(orderStatus)) {
            Transaction.wrap(function () {
                if (order.getStatus().valueOf() === Order.ORDER_STATUS_CREATED) {
                    status = OrderManager.failOrder(order, true);
                } else {
                    status = OrderManager.cancelOrder(order);
                }
                Logger.debug('Worldpay Job | Update Order Status : CANCELLED : {0} : Status : {1}', order.orderNo, status.message);
            });
            if (status.isError()) {
                return false;
            }
        }
        updateOrderStatusResult = UpdateOrderStatus.updateOrderStatus(order, serviceResponse, updateStatus, null);
        return updateOrderStatusResult.success;
    } else if (Resource.msg('notification.paymentStatus.EXPIRED', 'worldpay', null).equalsIgnoreCase(updateStatus)) {
        Transaction.wrap(function () {
            status = OrderManager.failOrder(order, true);
        });
        if (status.isError()) {
            return false;
        }
        Transaction.wrap(function () {
            updateOrderStatusResult = UpdateOrderStatus.updateOrderStatus(order, serviceResponse, updateStatus, null);
        });
        return updateOrderStatusResult.success;
    } else if (Resource.msg('notification.paymentStatus.CAPTURED', 'worldpay', null).equalsIgnoreCase(updateStatus) && ('CREATED').equalsIgnoreCase(orderStatus)) {
        Transaction.wrap(function () {
            status = OrderManager.placeOrder(order);
        });
        if (status.isError()) {
            return false;
        }

        Transaction.wrap(function () {
            updateOrderStatusResult = UpdateOrderStatus.updateOrderStatus(order, serviceResponse, updateStatus, null);
        });
        return updateOrderStatusResult.success;
    }
    Transaction.wrap(function () {
        updateOrderStatusResult = UpdateOrderStatus.updateOrderStatus(order, serviceResponse, updateStatus, null);
    });
    return updateOrderStatusResult.success;
}

/**
 * reads custom object
 * @param {Object} customObjectID - Custom Object
 * @return {Object} returns object as a response
 */
function readCustomObject(customObjectID) {
    var readNotifyCustomObjectResult;
    Transaction.wrap(function () {
        readNotifyCustomObjectResult = require('*/cartridge/scripts/pipelets/readNotifyCustomObject').readNotifyCustomObjectAWP(customObjectID);
    });
    return readNotifyCustomObjectResult;
}

/**
 * Removes custom object
 * @param {Object} customObjectID - Custom Object
 * @return {Object} returns result of remove call
 */
function removeCustomObject(customObjectID) {
    var removeCustomObjectResult;
    Transaction.wrap(function () {
        removeCustomObjectResult = require('*/cartridge/scripts/pipelets/removeNotifyCustomObject').removeNotifyCustomObject(customObjectID);
    });
    return removeCustomObjectResult;
}

module.exports = {
    updateOrderStatus: updateOrderStatus,
    readCustomObject: readCustomObject,
    removeCustomObject: removeCustomObject
};
