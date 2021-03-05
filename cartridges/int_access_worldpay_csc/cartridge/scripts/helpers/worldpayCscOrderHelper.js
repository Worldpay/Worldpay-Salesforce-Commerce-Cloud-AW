'use strict';
var OrderMgr = require('dw/order/OrderMgr');
var Transaction = require('dw/system/Transaction');
var ServiceFacade = require('*/cartridge/scripts/service/serviceFacade');
var Logger = require('dw/system/Logger');

/**
* Helper function for Cancelling order
* @param {string} orderNumber - order number
* @return {Object} returns an result object
*/
function cancelOrder(orderNumber) {
    var result;
    var order = OrderMgr.getOrder(orderNumber);
    if (order.custom.awpCancelUrl) {
        var cancelUrl = order.custom.awpCancelUrl;
        result = ServiceFacade.cscActions(cancelUrl);
    }
    if (!order) {
        Logger.getLogger('worldpay').error('authorize : Invalid Order');
        return result;
    }
    Transaction.wrap(function () {
        order.custom.cscLastEvent = 'cancelled';
    });
    return result;
}

/**
* Helper function for Settling order
* @param {string} orderNumber - order number
* @return {Object} returns an result object
*/
function settleOrder(orderNumber) {
    var result;
    var order = OrderMgr.getOrder(orderNumber);
    var Utils = require('*/cartridge/scripts/common/utils');
    var totalprice = Utils.calculateNonGiftCertificateAmount(order);
    var amount = totalprice.getValue();
    if (order.custom.awpSettleUrl) {
        var settleUrl = order.custom.awpSettleUrl;
        result = ServiceFacade.cscActions(settleUrl);
    }
    if (!order) {
        Logger.getLogger('worldpay').error('authorize : Invalid Order');
        return result;
    }
    var serviceResponse = result.serviceresponse;
    if (serviceResponse.refundUrl) {
        Transaction.wrap(function () {
            order.custom.awpRefundUrl = serviceResponse.refundUrl;
        });
    }
    if (serviceResponse.partialRefundUrl) {
        Transaction.wrap(function () {
            order.custom.awpPartialRefundUrl = serviceResponse.partialRefundUrl;
        });
    }

    Transaction.wrap(function () {
        order.custom.awpPartialSettleAmount = amount;
        order.custom.cscLastEvent = 'sentForSettlement';
    });

    return result;
}

/**
* Helper function for partial settling order
* @param {string} orderNumber - order number
* @param {integer} settleAmount - settleAmount
* @param {integer} partialSettleAmount - partialSettleAmount
* @param {string} currency - currency
* @return {Object} returns an result object
*/
function partialSettleOrder(orderNumber, settleAmount, partialSettleAmount, currency) {
    var result;
    var order = OrderMgr.getOrder(orderNumber);
    if (order.custom.awpPartialSettleUrl) {
        var partialSettleUrl = order.custom.awpPartialSettleUrl;
        result = ServiceFacade.cscPartialActions(partialSettleUrl, orderNumber, settleAmount, currency);
    }
    if (!order) {
        Logger.getLogger('worldpay').error('authorize : Invalid Order');
        return result;
    }

    if (result) {
        var serviceResponse = result.serviceresponse;
        if (serviceResponse.refundUrl) {
            Transaction.wrap(function () {
                order.custom.awpRefundUrl = serviceResponse.refundUrl;
            });
        }
        Transaction.wrap(function () {
            order.custom.awpPartialSettleAmount = (partialSettleAmount + settleAmount) / 100;
        });
    }

    Transaction.wrap(function () {
        order.custom.cscLastEvent = 'partiallysettled';
    });
    return result;
}

/**
* Helper function for initiating refund
* @param {string} orderNumber - order number
* @return {Object} returns an result object
*/
function refundOrder(orderNumber) {
    var result;

    var order = OrderMgr.getOrder(orderNumber);
    var refundUrl = order.custom.awpRefundUrl;
    if (!order) {
        Logger.getLogger('worldpay').error('authorize : Invalid Order');
        return result;
    }
    if (refundUrl) {
        result = ServiceFacade.cscActions(refundUrl);
    }

    Transaction.wrap(function () {
        order.custom.cscLastEvent = 'sentForRefund';
    });
    return result;
}


/**
* Helper function for partial refunding order
* @param {string} orderNumber - order number
* @param {integer} settleAmount - settleAmount
* @param {integer} partialRefundAmount - partialRefundAmount
* @param {string} currency - currency
* @return {Object} returns an result object
*/
function partialRefundOrder(orderNumber, settleAmount, partialRefundAmount, currency) {
    var result;
    var order = OrderMgr.getOrder(orderNumber);
    if (order.custom.awpPartialRefundUrl) {
        var awpPartialRefundUrl = order.custom.awpPartialRefundUrl;
        result = ServiceFacade.cscPartialActions(awpPartialRefundUrl, orderNumber, settleAmount, currency);
    }
    if (!order) {
        Logger.getLogger('worldpay').error('authorize : Invalid Order');
        return result;
    }
    if (result.success) {
        Transaction.wrap(function () {
            order.custom.awpPartialRefundAmount = (partialRefundAmount + settleAmount) / 100;
            order.custom.cscLastEvent = 'PartiallyRefunded';
        });
    }


    return result;
}
module.exports = {
    cancelOrder: cancelOrder,
    settleOrder: settleOrder,
    partialSettleOrder: partialSettleOrder,
    refundOrder: refundOrder,
    partialRefundOrder: partialRefundOrder
};
