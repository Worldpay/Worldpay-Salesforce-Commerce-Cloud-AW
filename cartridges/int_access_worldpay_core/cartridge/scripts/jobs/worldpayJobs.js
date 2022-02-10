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
    var Order = require('dw/order/Order');
    var Logger = require('dw/system/Logger');
    var worldpayConstants = require('*/cartridge/scripts/common/worldpayConstants');
    var orderStatus = order.status.displayValue;
    var orderStatusCode = order.getStatus().valueOf();
    var updateStatus = serviceResponseLastEvent;
    var status;
    var updateOrderStatusResult;
    Logger.getLogger('worldpay').debug('Update Order Status : ' + updateStatus + ' for Order Number : ' + order.orderNo + ' Current status: ' + orderStatus);
    if (orderStatusCode === Order.ORDER_STATUS_FAILED && (worldpayConstants.AUTHORIZED.equalsIgnoreCase(updateStatus))) {
        let undoFailOrderStatus = OrderManager.undoFailOrder(order);
        if (undoFailOrderStatus.isError) {
            Logger.getLogger('worldpay').debug('Update Order Status : Job Failed during undoFailOrder : ' + undoFailOrderStatus);
        }
        let placeOrderStatus = OrderManager.placeOrder(order);
        if (placeOrderStatus.isError) {
            Logger.getLogger('worldpay').debug('Update Order Status : Job Failed after undoFailOrder\'s place order : ' + placeOrderStatus);
        }
        orderStatus = order.status.displayValue;
    }
    if (worldpayConstants.AUTHORIZED.equalsIgnoreCase(updateStatus)) {
        if (!(orderStatusCode === Order.ORDER_STATUS_OPEN || orderStatusCode === Order.ORDER_STATUS_COMPLETED || orderStatusCode === Order.ORDER_STATUS_NEW)) {
            Transaction.wrap(function () {
                status = OrderManager.placeOrder(order);
            });
            if (status.isError()) {
                Logger.getLogger('worldpay').debug('Update Order Status : Place order for order num: ' + order.orderNo + ' failed. Order\'s current status: ' + orderStatus);
                return false;
            }
        }
        Transaction.wrap(function () {
            updateOrderStatusResult = UpdateOrderStatus.updateOrderStatus(order, serviceResponse, updateStatus, null);
        });
        return updateOrderStatusResult.success;
    } else if (worldpayConstants.REFUSED.equalsIgnoreCase(updateStatus)) {
        if (!(orderStatusCode === Order.ORDER_STATUS_CANCELLED || orderStatusCode === Order.ORDER_STATUS_FAILED)) {
            Transaction.wrap(function () {
                status = OrderManager.failOrder(order, true);
            });
            if (status.isError()) {
                Logger.getLogger('worldpay').debug('Update Order Status : ' + updateStatus + ' for Order: ' + order.orderNo + ' Failed');
                return false;
            }
        }
        Transaction.wrap(function () {
            updateOrderStatusResult = UpdateOrderStatus.updateOrderStatus(order, serviceResponse, updateStatus, null);
        });
        return updateOrderStatusResult.success;
    } else if (worldpayConstants.CANCELLEDSTATUS.equalsIgnoreCase(updateStatus)) {
        if (orderStatusCode === Order.ORDER_STATUS_CANCELLED) {
            Logger.getLogger('worldpay').debug('Update Order Status : ' + updateStatus);
            Transaction.wrap(function () {
                if (orderStatusCode === Order.ORDER_STATUS_CREATED) {
                    status = OrderManager.failOrder(order, true);
                } else {
                    status = OrderManager.cancelOrder(order);
                }
                Logger.debug('Update Order Status : CANCELLED : {0} : Status : {1}', order.orderNo, status.message);
            });
            if (status.isError()) {
                return false;
            }
        }
        updateOrderStatusResult = UpdateOrderStatus.updateOrderStatus(order, serviceResponse, updateStatus, null);
        return updateOrderStatusResult.success;
    } else if (worldpayConstants.EXPIRED.equalsIgnoreCase(updateStatus)) {
        Transaction.wrap(function () {
            status = OrderManager.failOrder(order, true);
        });
        if (status.isError()) {
            Logger.getLogger('worldpay').debug('Update Order Status : Payment : ' + updateStatus + ' for Order: ' + order.orderNo);
            return false;
        }
        Transaction.wrap(function () {
            updateOrderStatusResult = UpdateOrderStatus.updateOrderStatus(order, serviceResponse, updateStatus, null);
        });
        return updateOrderStatusResult.success;
    } else if (worldpayConstants.CAPTURED.equalsIgnoreCase(updateStatus) && orderStatusCode === Order.ORDER_STATUS_CREATED) {
        Transaction.wrap(function () {
            status = OrderManager.placeOrder(order);
        });
        if (status.isError()) {
            Logger.getLogger('worldpay').debug('Update Order Status : Order ' + order.orderNo + ' failed after : ' + updateStatus + ' Place order Status: ' + status);
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
