'use strict';

var server = require('server');
var params = request.httpParameterMap;
var Order = require('dw/order/Order');

/**
* Method that does a form submission, to render the CancelOrder page
*/
server.get('CancelOrder', function (req, res, next) {
    var orderID = params.order_no.stringValue;
    var orderToken = params.order_token.stringValue;
    var OrderMgr = require('dw/order/OrderMgr');
    var order = OrderMgr.getOrder(orderID, orderToken);

    res.render('/order/cancelOrder', {
        order: order,
        requestType: '',
        statusConfirmed: Order.CONFIRMATION_STATUS_CONFIRMED
    });
    next();
});

/**
* Method that does a form submission, to render the SettleOrder page
*/
server.get('SettleOrder', function (req, res, next) {
    var orderID = params.order_no.stringValue;
    var orderToken = params.order_token.stringValue;
    var OrderMgr = require('dw/order/OrderMgr');
    var order = OrderMgr.getOrder(orderID, orderToken);

    res.render('/order/settleOrder', {
        order: order,
        requestType: '',
        statusConfirmed: Order.CONFIRMATION_STATUS_CONFIRMED
    });
    next();
});


/**
* Method that does a form submission, to render the PartialSettleOrder page
*/
server.get('PartialSettleOrder', function (req, res, next) {
    var orderID = params.order_no.stringValue;
    var orderToken = params.order_token.stringValue;
    var OrderMgr = require('dw/order/OrderMgr');
    var order = OrderMgr.getOrder(orderID, orderToken);
    var Utils = require('*/cartridge/scripts/common/utils');
    var totalprice = Utils.calculateNonGiftCertificateAmount(order);
    var amount = totalprice.getValue();
    res.render('/order/partialSettleOrder', {
        order: order,
        amount: amount,
        requestType: '',
        statusConfirmed: Order.CONFIRMATION_STATUS_CONFIRMED
    });
    next();
});


/**
* Method that does a form submission, to render the RefundOrder page
*/
server.get('RefundOrder', function (req, res, next) {
    var orderID = params.order_no.stringValue;
    var orderToken = params.order_token.stringValue;
    var OrderMgr = require('dw/order/OrderMgr');
    var order = OrderMgr.getOrder(orderID, orderToken);

    res.render('/order/refundOrder', {
        order: order,
        requestType: '',
        statusConfirmed: Order.CONFIRMATION_STATUS_CONFIRMED
    });
    next();
});

/**
* Method that does a form submission, to render the Void Sale page
*/
server.get('VoidSale', function (req, res, next) {
    var orderID = params.order_no.stringValue;
    var OrderMgr = require('dw/order/OrderMgr');
    var OrderHelpers = require('*/cartridge/scripts/helpers/worldpayCscOrderHelper');
    var hourDifference = OrderHelpers.getHourDifference(orderID);
    var order = OrderMgr.getOrder(orderID);
    res.render('/order/voidSale', {
        order: order,
        requestType: '',
        hourDifference: hourDifference,
        statusConfirmed: Order.CONFIRMATION_STATUS_CONFIRMED
    });
    next();
});

/**
* Method that does a form submission, to render the PartialRefundOrder page
*/
server.get('PartialRefundOrder', function (req, res, next) {
    var orderID = params.order_no.stringValue;
    var orderToken = params.order_token.stringValue;
    var OrderMgr = require('dw/order/OrderMgr');
    var order = OrderMgr.getOrder(orderID, orderToken);
    var Utils = require('*/cartridge/scripts/common/utils');
    var totalprice = Utils.calculateNonGiftCertificateAmount(order);
    var amount = totalprice.getValue();
    res.render('/order/partialRefundOrder', {
        order: order,
        requestType: '',
        amount: amount,
        statusConfirmed: Order.CONFIRMATION_STATUS_CONFIRMED
    });
    next();
});


/**
* Service to trigger Cancel Order Action.
*/
server.get('CancelOrderAction', function (req, res, next) {
    var orderID = params.order_id.stringValue;
    var orderToken = params.order_token.stringValue;
    var success = true;
    var OrderMgr = require('dw/order/OrderMgr');
    var worldpayCscOrderHelper = require('*/cartridge/scripts/helpers/worldpayCscOrderHelper');
    var order = OrderMgr.getOrder(orderID, orderToken);
    var result = worldpayCscOrderHelper.cancelOrder(orderID);
    if (!result || result.error) {
        success = false;
    }
    res.render('/order/cancelOrder', {
        order: order,
        requestType: 'response',
        success: success,
        statusConfirmed: Order.CONFIRMATION_STATUS_CONFIRMED
    });
    next();
});

/**
* Service to trigger Settle Order Action.
*/
server.get('SettleOrderAction', function (req, res, next) {
    var orderID = params.order_id.stringValue;
    var orderToken = params.order_token.stringValue;
    var success = true;
    var OrderMgr = require('dw/order/OrderMgr');
    var worldpayCscOrderHelper = require('*/cartridge/scripts/helpers/worldpayCscOrderHelper');
    var order = OrderMgr.getOrder(orderID, orderToken);
    var result = worldpayCscOrderHelper.settleOrder(orderID);
    if (!result || result.error) {
        success = false;
    }
    res.render('/order/settleOrder', {
        order: order,
        requestType: 'response',
        success: success,
        statusConfirmed: Order.CONFIRMATION_STATUS_CONFIRMED
    });
    next();
});


/**
* Service to trigger Partial Settle Order Action.
*/
server.get('PartialSettleOrderAction', function (req, res, next) {
    var orderID = params.order_id.stringValue;
    var orderToken = params.order_token.stringValue;
    var settleamount = params.settleAmount.rawValue;
    var success = true;
    var OrderMgr = require('dw/order/OrderMgr');
    var worldpayCscOrderHelper = require('*/cartridge/scripts/helpers/worldpayCscOrderHelper');
    var order = OrderMgr.getOrder(orderID, orderToken);
    var partialSettleAmount = order.custom.awpPartialSettleAmount;
    var Utils = require('*/cartridge/scripts/common/utils');
    var totalprice = Utils.calculateNonGiftCertificateAmount(order);
    var amount = totalprice.getValue();
    // multiplying amount with currentExponent (2) power of 10 since downstream systems have currency exponent of 2
    amount = parseInt((amount.toFixed(2) * (Math.pow(10, 2))).toFixed(0), 10);
    settleamount = parseInt((settleamount * (Math.pow(10, 2))).toFixed(0), 10);
    partialSettleAmount = parseInt((partialSettleAmount * (Math.pow(10, 2))).toFixed(0), 10);
    var currency = totalprice.getCurrencyCode().toString();
    var result;
    if (settleamount <= amount && (settleamount + partialSettleAmount) <= amount) {
        result = worldpayCscOrderHelper.partialSettleOrder(orderID, settleamount, partialSettleAmount, currency);
    } else {
        success = false;
    }
    if (!result || result.error) {
        success = false;
    }
    res.render('/order/partialSettleOrder', {
        order: order,
        requestType: 'response',
        success: success,
        statusConfirmed: Order.CONFIRMATION_STATUS_CONFIRMED
    });
    next();
});


/**
* Service to trigger Refund Order Action.
*/
server.get('RefundOrderAction', function (req, res, next) {
    var orderID = params.order_id.stringValue;
    var orderToken = params.order_token.stringValue;
    var success = true;
    var OrderMgr = require('dw/order/OrderMgr');
    var worldpayCscOrderHelper = require('*/cartridge/scripts/helpers/worldpayCscOrderHelper');
    var order = OrderMgr.getOrder(orderID, orderToken);
    var result = worldpayCscOrderHelper.refundOrder(orderID);
    if (!result || result.error) {
        success = false;
    }
    res.render('/order/refundOrder', {
        order: order,
        requestType: 'response',
        success: success,
        statusConfirmed: Order.CONFIRMATION_STATUS_CONFIRMED
    });
    next();
});


/**
* Service to trigger Partial Refund Order Action.
*/
server.get('PartialRefundOrderAction', function (req, res, next) {
    var orderID = params.order_id.stringValue;
    var orderToken = params.order_token.stringValue;
    var settleamount = params.refundAmount.rawValue;
    var success = true;
    var OrderMgr = require('dw/order/OrderMgr');
    var worldpayCscOrderHelper = require('*/cartridge/scripts/helpers/worldpayCscOrderHelper');
    var order = OrderMgr.getOrder(orderID, orderToken);
    var partialRefundAmount = order.custom.awpPartialRefundAmount;
    var Utils = require('*/cartridge/scripts/common/utils');
    var totalprice = Utils.calculateNonGiftCertificateAmount(order);
    var amount = totalprice.getValue();
    // multiplying amount with currentExponent (2) power of 10 since downstream systems have currency exponent of 2
    amount = parseInt((amount.toFixed(2) * (Math.pow(10, 2))).toFixed(0), 10);
    settleamount = parseInt((settleamount * (Math.pow(10, 2))).toFixed(0), 10);
    partialRefundAmount = parseInt((partialRefundAmount * (Math.pow(10, 2))).toFixed(0), 10);
    var currency = totalprice.getCurrencyCode().toString();
    var result;
    if (settleamount <= amount && (settleamount + partialRefundAmount) <= amount) {
        result = worldpayCscOrderHelper.partialRefundOrder(orderID, settleamount, partialRefundAmount, currency);
    } else {
        success = false;
    }
    if (!result || result.error) {
        success = false;
    }
    res.render('/order/partialRefundOrder', {
        order: order,
        requestType: 'response',
        success: success,
        statusConfirmed: Order.CONFIRMATION_STATUS_CONFIRMED
    });
    next();
});


/**
* Service to trigger Void Sale actions for ACH Pay oders.
*/
server.get('VoidSaleAction', function (req, res, next) {
    var orderID = params.order_id.stringValue;
    var success = true;
    var OrderMgr = require('dw/order/OrderMgr');
    var OrderHelpers = require('*/cartridge/scripts/helpers/worldpayCscOrderHelper.js');
    var order = OrderMgr.getOrder(orderID);
    var result = OrderHelpers.voidSale(orderID);
    if (!result || result.error) {
        success = false;
    }
    res.render('/order/voidSale', {
        order: order,
        requestType: 'response',
        success: success,
        statusConfirmed: Order.CONFIRMATION_STATUS_CONFIRMED
    });
    next();
});


module.exports = server.exports();
