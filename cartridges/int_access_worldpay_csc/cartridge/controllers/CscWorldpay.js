'use strict';

var server = require('server');
var params = request.httpParameterMap;
var Order = require('dw/order/Order');

server.get('CancelOrder', function (req, res, next) {
    var orderID = params.order_no.stringValue;
    var OrderMgr = require('dw/order/OrderMgr');
    var order = OrderMgr.getOrder(orderID);

    res.render('/order/cancelOrder', {
        order: order,
        requestType: '',
        statusConfirmed: Order.CONFIRMATION_STATUS_CONFIRMED
    });
    next();
});


server.get('SettleOrder', function (req, res, next) {
    var orderID = params.order_no.stringValue;
    var OrderMgr = require('dw/order/OrderMgr');
    var order = OrderMgr.getOrder(orderID);

    res.render('/order/settleOrder', {
        order: order,
        requestType: '',
        statusConfirmed: Order.CONFIRMATION_STATUS_CONFIRMED
    });
    next();
});


server.get('PartialSettleOrder', function (req, res, next) {
    var orderID = params.order_no.stringValue;
    var OrderMgr = require('dw/order/OrderMgr');
    var order = OrderMgr.getOrder(orderID);
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


server.get('RefundOrder', function (req, res, next) {
    var orderID = params.order_no.stringValue;
    var OrderMgr = require('dw/order/OrderMgr');
    var order = OrderMgr.getOrder(orderID);

    res.render('/order/refundOrder', {
        order: order,
        requestType: '',
        statusConfirmed: Order.CONFIRMATION_STATUS_CONFIRMED
    });
    next();
});


server.get('PartialRefundOrder', function (req, res, next) {
    var orderID = params.order_no.stringValue;
    var OrderMgr = require('dw/order/OrderMgr');
    var order = OrderMgr.getOrder(orderID);
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
server.get('CancelOrderAction', function (req, res, next) {
    var orderID = params.order_id.stringValue;
    var success = true;
    var OrderMgr = require('dw/order/OrderMgr');
    var OrderHelpers = require('*/cartridge/scripts/helpers/worldpayCscOrderHelper');
    var order = OrderMgr.getOrder(orderID);
    var result = OrderHelpers.cancelOrder(orderID);
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
server.get('SettleOrderAction', function (req, res, next) {
    var orderID = params.order_id.stringValue;
    var success = true;
    var OrderMgr = require('dw/order/OrderMgr');
    var OrderHelpers = require('*/cartridge/scripts/helpers/worldpayCscOrderHelper');
    var order = OrderMgr.getOrder(orderID);
    var result = OrderHelpers.settleOrder(orderID);
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

server.get('PartialSettleOrderAction', function (req, res, next) {
    var orderID = params.order_id.stringValue;
    var settleamount = params.settleAmount.rawValue;
    var success = true;
    var OrderMgr = require('dw/order/OrderMgr');
    var OrderHelpers = require('*/cartridge/scripts/helpers/worldpayCscOrderHelper');
    var order = OrderMgr.getOrder(orderID);
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
        result = OrderHelpers.partialSettleOrder(orderID, settleamount, partialSettleAmount, currency);
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

server.get('RefundOrderAction', function (req, res, next) {
    var orderID = params.order_id.stringValue;
    var success = true;
    var OrderMgr = require('dw/order/OrderMgr');
    var OrderHelpers = require('*/cartridge/scripts/helpers/worldpayCscOrderHelper');
    var order = OrderMgr.getOrder(orderID);
    var result = OrderHelpers.refundOrder(orderID);
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


server.get('PartialRefundOrderAction', function (req, res, next) {
    var orderID = params.order_id.stringValue;
    var settleamount = params.refundAmount.rawValue;
    var success = true;
    var OrderMgr = require('dw/order/OrderMgr');
    var OrderHelpers = require('*/cartridge/scripts/helpers/worldpayCscOrderHelper');
    var order = OrderMgr.getOrder(orderID);
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
        result = OrderHelpers.partialRefundOrder(orderID, settleamount, partialRefundAmount, currency);
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


module.exports = server.exports();
