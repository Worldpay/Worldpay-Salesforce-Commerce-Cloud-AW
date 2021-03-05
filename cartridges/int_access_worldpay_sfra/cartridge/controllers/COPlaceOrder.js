/* eslint-disable no-undef */
'use strict';
var server = require('server');

var Logger = require('dw/system/Logger');
var PaymentMgr = require('dw/order/PaymentMgr');
var OrderMgr = require('dw/order/OrderMgr');
var OrderModel = require('*/cartridge/models/order');
var Resource = require('dw/web/Resource');
var Transaction = require('dw/system/Transaction');
var URLUtils = require('dw/web/URLUtils');
var Utils = require('*/cartridge/scripts/common/utils');
var WorldpayConstants = require('*/cartridge/scripts/common/worldpayConstants');
var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');


/**
 *  Handle Ajax after order review page palce order
 */
server.get('Submit', function (req, res, next) {
    var order = OrderMgr.getOrder(req.querystring.order_id);
    var error;
    if (!empty(session.privacy.currentOrderNo)) {
        delete session.privacy.currentOrderNo;
    }
    if (!order && req.querystring.order_token !== order.getOrderToken()) {
        res.redirect(URLUtils.url('Cart-Show'));
        return next();
    }

    var isWorldpayPaymentProcessor = false;
    var paymentInstruments = order.getPaymentInstruments();
    var paymentMethod;
    var paymentInstrument;
    var authResult;
    var pendingResult;
    if (paymentInstruments.length > 0) {
        for (var i = 0; i < paymentInstruments.length; i++) {
            paymentInstrument = paymentInstruments[i];
            var paymentProcessor = PaymentMgr.getPaymentMethod(paymentInstrument.getPaymentMethod())
                    .getPaymentProcessor();
            if (paymentProcessor != null && paymentProcessor.getID().toLowerCase().equals('worldpay')) {
                isWorldpayPaymentProcessor = true;
                paymentMethod = paymentInstrument.paymentMethod;
                break;
            }
        }
    }

    if (isWorldpayPaymentProcessor) {
        var paymentStatus = req.querystring.paymentStatus;
        if (undefined !== paymentStatus && paymentStatus[0] === WorldpayConstants.AUTHORIZED) {
            paymentStatus = WorldpayConstants.AUTHORIZED;
        }
        if (undefined !== paymentStatus && paymentStatus[1] === WorldpayConstants.PENDING) {
            paymentStatus = WorldpayConstants.PENDING;
        }
        Logger.getLogger('worldpay').debug(req.querystring.order_id + ' orderid COPlaceOrder paymentStatus ' + paymentStatus);
        if (undefined !== paymentStatus && paymentStatus.equals(WorldpayConstants.AUTHORIZED)) {
            req.session.privacyCache.set('order_id', null);

            authResult = authStatusOrderPlacement(paymentMethod, paymentStatus, paymentInstrument, order);
            Transaction.wrap(function () {
                order.custom.WorldpayLastEvent = WorldpayConstants.AUTHORIZED;
            });
            if (authResult.redirect && authResult.stage.equals('placeOrder')) {
                res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'placeOrder', 'placeerror', authResult.placeerror));
                return next();
            }

            if (authResult.redirect && authResult.stage.equals('payment')) {
                res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'payment', 'placeerror', authResult.placeerror));
                return next();
            }
        } else if (undefined !== paymentStatus && paymentStatus.equals(WorldpayConstants.PENDING)) {
            var PendingStatus = req.querystring.status;

            pendingResult = pendingStatusOrderPlacement(PendingStatus, order, paymentMethod);
            Transaction.wrap(function () {
                order.custom.WorldpayLastEvent = WorldpayConstants.PENDING;
            });
            if (pendingResult.error) {
                res.redirect(URLUtils.url('Cart-Show'));
            }
            if (pendingResult.redirect && pendingResult.stage.equals('placeOrder')) {
                res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'placeOrder', 'placeerror', pendingResult.placeerror));
                return next();
            }

            if (pendingResult.redirect && pendingResult.stage.equals('payment')) {
                res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'payment', 'placeerror', pendingResult.placeerror));
                return next();
            }

            if (pendingResult.redirect && pendingResult.stage.equals('orderConfirm')) {
                COHelpers.sendConfirmationEmail(order, req.locale.id);
                res.redirect(URLUtils.url('Order-Confirm', 'ID', pendingResult.ID, 'token', pendingResult.token).toString());
                return next();
            }
        } else {
            var orderInformation = Utils.getWorldpayOrderInfo(paymentStatus);
            Transaction.wrap(function () {
                order.custom.WorldpayLastEvent = WorldpayConstants.REFUSED;
            });

            if (paymentMethod.equals(WorldpayConstants.APPLEPAY)) {
                if (undefined !== paymentStatus && (paymentStatus.equals(WorldpayConstants.CANCELLEDSTATUS) || paymentStatus.equals(WorldpayConstants.REFUSED))) {
                    if (require('*/cartridge/scripts/common/utils').verifyMac(orderInformation.mac,
                        orderInformation.orderKey,
                        orderInformation.orderAmount,
                        orderInformation.orderCurrency,
                        orderInformation.orderStatus).error) {
                        res.redirect(URLUtils.url('Cart-Show'));
                        return next();
                    }
                    if (paymentStatus.equals(WorldpayConstants.CANCELLEDSTATUS)) {
                        var ArrayList = require('dw/util/ArrayList');
                        Transaction.wrap(function () {
                            order.custom.transactionStatus = new ArrayList('POST_AUTH_CANCELLED');
                        });
                    }
                }
            }
            error = Utils.worldpayErrorMessage();
            Transaction.wrap(function () {
                OrderMgr.failOrder(order, true);
            });
            if (session.privacy.currentOrderNo) {
                delete session.privacy.currentOrderNo;
            }
            res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'placeOrder', 'placeerror', error.errorMessage));
            return next();
        }
        var orderPlacementStatus = COHelpers.placeOrder(order);

        if (orderPlacementStatus.error) {
            res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'payment', 'placeerror', Resource.msg('error.technical', 'checkout', null)));
            return next();
        }

        var config = {
            numberOfLineItems: '*'
        };
        var orderModel = new OrderModel(order, { config: config });
        COHelpers.sendConfirmationEmail(order, req.locale.id);
        if (!req.currentCustomer.profile) {
            var passwordForm = server.forms.getForm('newPasswords');
            passwordForm.clear();
            res.render('checkout/confirmation/confirmation', {
                order: orderModel,
                returningCustomer: false,
                passwordForm: passwordForm
            });
        } else {
            res.render('checkout/confirmation/confirmation', {
                order: orderModel,
                returningCustomer: true
            });
        }
    } else {
        res.redirect(URLUtils.url('Cart-Show'));
        return next();
    }
    return next();
});

server.post('SubmitOrder', csrfProtection.generateToken, function (req, res, next) {
    var order = OrderMgr.getOrder(req.querystring.order_id);
    if (!order && req.querystring.order_token !== order.getOrderToken()) {
        res.redirect(URLUtils.url('Cart-Show'));
        return next();
    }
    var paymentInstrument = null;
    if (!empty(order) && !empty(order.getPaymentInstruments())) {
        paymentInstrument = order.getPaymentInstruments()[0];
    }

    if (!empty(paymentInstrument) && paymentInstrument.paymentMethod === 'DW_APPLE_PAY') {
        COHelpers.executeOrderProcess(order, req, res, next);
    }
    return next();
});

module.exports = server.exports();
