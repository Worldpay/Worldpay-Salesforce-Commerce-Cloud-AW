'use strict';
var base = module.superModule;
var OrderMgr = require('dw/order/OrderMgr');
var Order = require('dw/order/Order');
var Status = require('dw/system/Status');
var Transaction = require('dw/system/Transaction');
var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');

var Logger = require('dw/system/Logger');
var Resource = require('dw/web/Resource');
var URLUtils = require('dw/web/URLUtils');
var Utils = require('*/cartridge/scripts/common/utils');
var WorldpayConstants = require('*/cartridge/scripts/common/worldpayConstants');

/**
 * @param {order} order object
 * @returns {result} order status error
 */
function placeOrder(order) {
    var result = {
        error: false
    };

    try {
        Transaction.begin();
        var placeOrderStatus = OrderMgr.placeOrder(order);
        if (placeOrderStatus === Status.ERROR) {
            throw new Error();
        }
        order.setConfirmationStatus(Order.CONFIRMATION_STATUS_CONFIRMED);
        Transaction.commit();
    } catch (e) {
        Transaction.wrap(function () {
            OrderMgr.failOrder(order, true);
        });
        result.error = true;
    }

    return result;
}


/**
 * renders the user's stored payment Instruments
 * @param {Object} req - The request object
 * @param {Object} accountModel - The account model for the current customer
 * @returns {string|null} newly stored payment Instrument
 */
function getRenderedPaymentInstrumentsForRedirect(req, accountModel) {
    var result;
    if (req.currentCustomer.raw.authenticated
        && req.currentCustomer.raw.registered
        && req.currentCustomer.raw.profile.wallet.paymentInstruments.getLength()
    ) {
        var context;
        var template = 'checkout/billing/storedRedirectCards';

        context = { customer: accountModel };
        result = renderTemplateHelper.getRenderedHtml(
            context,
            template
        );
    }
    return result || null;
}

/**
 * Validates payment
 * @param {Object} req - The local instance of the request object
 * @param {dw.order.Basket} currentBasket - The current basket
 * @returns {Object} an object that has error information
 */
function validatePayment(req, currentBasket) {
    var PaymentMgr = require('dw/order/PaymentMgr');
    var PaymentInstrument = require('dw/order/PaymentInstrument');
    var applicablePaymentCards;
    var applicablePaymentMethods;
    var creditCardPaymentMethod = PaymentMgr.getPaymentMethod(PaymentInstrument.METHOD_CREDIT_CARD);
    var paymentAmount = currentBasket.totalGrossPrice.value;
    var countryCode = currentBasket.billingAddress.countryCode;
    var currentCustomer = req.currentCustomer.raw;
    var paymentInstruments = currentBasket.paymentInstruments;
    var result = {};

    applicablePaymentMethods = PaymentMgr.getApplicablePaymentMethods(
        currentCustomer,
        countryCode,
        paymentAmount
    );
    applicablePaymentCards = creditCardPaymentMethod.getApplicablePaymentCards(
        currentCustomer,
        countryCode,
        paymentAmount
    );

    var invalid = true;

    for (var i = 0; i < paymentInstruments.length; i++) {
        var paymentInstrument = paymentInstruments[i];

        if (PaymentInstrument.METHOD_GIFT_CERTIFICATE.equals(paymentInstrument.paymentMethod)) {
            invalid = false;
        }

        var paymentMethod = PaymentMgr.getPaymentMethod(paymentInstrument.getPaymentMethod());

        if (paymentMethod && applicablePaymentMethods.contains(paymentMethod)) {
            if (PaymentInstrument.METHOD_CREDIT_CARD.equals(paymentInstrument.paymentMethod)) {
                var card = PaymentMgr.getPaymentCard(paymentInstrument.creditCardType);

                // Checks whether payment card is still applicable.
                if (card && applicablePaymentCards.contains(card)) {
                    invalid = false;
                }
            } else {
                invalid = false;
            }
        }

        if (invalid) {
            break; // there is an invalid payment instrument
        }
    }

    result.error = invalid;
    return result;
}

/**
 * handles the payment authorization for each payment instrument
 * @param {dw.order.Order} order - the order object
 * @param {string} orderNumber - The order number for the order
 * @returns {Object} an error object
 */
function handlePayments(order, orderNumber) {
    var result = {};
    var HookMgr = require('dw/system/HookMgr');
    var PaymentMgr = require('dw/order/PaymentMgr');

    if (order.totalNetPrice !== 0.00) {
        var paymentInstruments = order.paymentInstruments;

        if (paymentInstruments.length === 0) {
            Transaction.wrap(function () { OrderMgr.failOrder(order, true); });
            result.error = true;
        }

        if (!result.error) {
            for (var i = 0; i < paymentInstruments.length; i++) {
                var paymentInstrument = paymentInstruments[i];
                var paymentProcessor = PaymentMgr
                    .getPaymentMethod(paymentInstrument.paymentMethod)
                    .paymentProcessor;
                var authorizationResult;
                if (paymentProcessor === null) {
                    Transaction.begin();
                    paymentInstrument.paymentTransaction.setTransactionID(orderNumber);
                    Transaction.commit();
                } else {
                    if (HookMgr.hasHook('app.payment.processor.' +
                        paymentProcessor.ID.toLowerCase())) {
                        authorizationResult = HookMgr.callHook(
                            'app.payment.processor.' + paymentProcessor.ID.toLowerCase(),
                            'Authorize',
                            orderNumber,
                            paymentInstrument,
                            paymentProcessor
                        );
                    } else {
                        authorizationResult = HookMgr.callHook(
                            'app.payment.processor.default',
                            'Authorize'
                        );
                    }
                    result = authorizationResult;
                    if (authorizationResult.error) {
                        Transaction.wrap(function () { OrderMgr.failOrder(order, true); });
                        result.error = true;
                        break;
                    }
                }
            }
        }
    }
    return result;
}

/**
 * Deletes the order number from session
 */
function deleteSessionOrderNum() {
    var orderManager = require('dw/order/OrderMgr');
    if (session.privacy.currentOrderNo) {
        Transaction.wrap(function () {
            orderManager.failOrder(orderManager.getOrder(session.privacy.currentOrderNo), true);
        });
        delete session.privacy.currentOrderNo;
    }
}

/**
 * Attempts to create an order from the current basket
 * @param {dw.order.Basket} currentBasket - The current basket
 * @returns {dw.order.Order} The order object created from the current basket
 */
function createOrder(currentBasket) {
    var order;
    order = base.createOrder(currentBasket);
    // Using the session attribute to handle browser back scenarios in 3ds
    session.privacy.currentOrderNo = order.orderNo;
    return order;
}

/**
 * Sends a confirmation to the current user
 * @param {dw.order.Order} order - The current user's order
 * @param {string} locale - the current request's locale id
 * @returns {void}
 */
function sendConfirmationEmail(order, locale) {
    base.sendConfirmationEmail(order, locale);
    // Clearing off the session attr as soon as the order process completes.
    if (!empty(session.privacy.currentOrderNo)) {
        delete session.privacy.currentOrderNo;
    }
}

/**
 *
 * @param {Order} order - Order
 * @param {Object} req - Request
 * @param {Object} res - Response
 * @param {Object} next - Next
 * @returns {Object} next
 */
function executeOrderProcess(order, req, res, next) {
    if (!order && req.querystring.order_token !== order.getOrderToken()) {
        return next(new Error(Resource.msg('error.applepay.token.mismatch', 'checkout', null)));
    }
    var hooksHelper = require('*/cartridge/scripts/helpers/hooks');
    var fraudDetectionStatus = hooksHelper('app.fraud.detection', 'fraudDetection', order, require('*/cartridge/scripts/hooks/fraudDetection').fraudDetection);

    if (fraudDetectionStatus.status === 'fail') {
        Transaction.wrap(function () {
            OrderMgr.failOrder(order);
        });
        req.session.privacyCache.set('fraudDetectionStatus', true);
        res.json({
            error: true,
            cartError: true,
            redirectUrl: URLUtils.url('Error-ErrorCode', 'err', fraudDetectionStatus.errorCode).toString(),
            errorMessage: Resource.msg('error.applepay.fraud', 'checkout', null)
        });
        return next();
    }

    var placeOrderResult = placeOrder(order, fraudDetectionStatus);
    if (placeOrderResult.error) {
        res.json({
            error: true,
            errorMessage: Resource.msg('error.applepay.place.order', 'checkout', null)
        });
        return next();
    }

    sendConfirmationEmail(order, req.locale.id);
    res.render('/checkout/orderConfirmForm', {
        error: false,
        orderID: order.orderNo,
        orderToken: order.orderToken,
        continueUrl: URLUtils.url('Order-Confirm').toString()
    });
    return next();
}


/**
 * Pending status order placement
 * @param {string} PendingStatus - PendingStatus
 * @param {dw.order.Order} order - the order object
 * @param {Object} paymentMethod - paymentMethod Object
 * @return {Object} returns an json object
 */
function pendingStatusOrderPlacement(PendingStatus, order, paymentMethod) {
    var error;
    if (undefined === PendingStatus || PendingStatus.equals(WorldpayConstants.OPEN)) {
        if (order.status.value === Order.ORDER_STATUS_FAILED) {
            error = Utils.getErrorMessage();
            return {
                redirect: true,
                stage: 'payment',
                placeerror: error.errorMessage
            };
        }
        return {
            redirect: true,
            stage: 'orderConfirm',
            ID: order.orderNo,
            token: order.orderToken
        };
    }
    error = Utils.getErrorMessage();
    if (paymentMethod.equals(WorldpayConstants.KONBINI)) {
        Transaction.wrap(function () {
            OrderMgr.cancelOrder(order);
        });
        return {
            error: true
        };
    }
    Transaction.wrap(function () {
        OrderMgr.failOrder(order, true);
    });
    return {
        redirect: true,
        stage: 'placeOrder',
        placeerror: error.errorMessage
    };
}

/**
 * Authorize status order placement
 * @param {Object} paymentMethod - paymentMethod Object
 * @param {string} paymentStatus - transaction payment status
 * @param {dw.order.PaymentInstrument} paymentInstrument -  The payment instrument
 * @param {dw.order.Order} orderObj - the order object
 * @return {Object} returns an json object
 */
function authStatusOrderPlacement(paymentMethod, paymentStatus, paymentInstrument, orderObj) {
    var error;
    var order = orderObj;
    if (paymentMethod.equals(WorldpayConstants.APPLEPAY)) {
        var orderInfo = Utils.getWorldpayOrderInfo(paymentStatus);
        var macstatus = Utils.verifyMac(orderInfo.mac, orderInfo.orderKey, orderInfo.orderAmount, orderInfo.orderCurrency, orderInfo.orderStatus);
        if (macstatus.error) {
            Transaction.wrap(function () {
                order.custom.worldpayMACMissingVal = true;
            });
            error = Utils.getErrorMessage();
            Transaction.wrap(function () { OrderMgr.failOrder(order, true); });
            Logger.getLogger('worldpay').error(' mac issue ');
            return {
                redirect: true,
                stage: 'placeOrder',
                placeerror: error.errorMessage
            };
        }
    }
    if (order.status.value === Order.ORDER_STATUS_FAILED && paymentStatus !== 'AUTHORISED') {
        Transaction.wrap(function () {
            order.custom.worldpayMACMissingVal = true;
        });
        error = Utils.getErrorMessage();
        return {
            redirect: true,
            stage: 'payment',
            placeerror: error.errorMessage
        };
    }
    return {
        success: true,
        paymentMethod: paymentMethod
    };
}

/**
 * Delete the token in session and in WP token store.
 * @param{string} clearToken - the token to be deleted
 */
function deletWPToken(clearToken) {
    try {
        var ServiceFacade = require('*/cartridge/scripts/service/serviceFacade');
        ServiceFacade.deleteToken(clearToken);
        delete session.privacy.clearToken;
        Logger.getLogger('worldpay').debug('Token deleted successfully !!!');
    } catch (e) {
        Logger.getLogger('worldpay').error('Exception during delete token !!! ' + clearToken + ' ' + e.message);
    }
}

/**
 * Delete the token in session.
 * @param{string} outcome - the token to be deleted
 *  @return {boolean} returns an boolean
 */
function authenticationRequest3DsOutcome(outcome) {
    switch (outcome) {
        case 'bypassed':
        case 'unavailable':
        case 'authenticated':
        case 'notEnrolled':
            return true;
        default:
            return false;
    }
}

module.exports = {
    getFirstNonDefaultShipmentWithProductLineItems: base.getFirstNonDefaultShipmentWithProductLineItems,
    ensureNoEmptyShipments: base.ensureNoEmptyShipments,
    getProductLineItem: base.getProductLineItem,
    isShippingAddressInitialized: base.isShippingAddressInitialized,
    prepareCustomerForm: base.prepareCustomerForm,
    prepareShippingForm: base.prepareShippingForm,
    prepareBillingForm: base.prepareBillingForm,
    copyCustomerAddressToShipment: base.copyCustomerAddressToShipment,
    copyCustomerAddressToBilling: base.copyCustomerAddressToBilling,
    copyShippingAddressToShipment: base.copyShippingAddressToShipment,
    copyBillingAddressToBasket: base.copyBillingAddressToBasket,
    validateFields: base.validateFields,
    validateCustomerForm: base.validateCustomerForm,
    validateShippingForm: base.validateShippingForm,
    validateBillingForm: base.validateBillingForm,
    validatePayment: validatePayment,
    validateCreditCard: base.validateCreditCard,
    calculatePaymentTransaction: base.calculatePaymentTransaction,
    recalculateBasket: base.recalculateBasket,
    handlePayments: handlePayments,
    createOrder: createOrder,
    placeOrder: placeOrder,
    savePaymentInstrumentToWallet: base.savePaymentInstrumentToWallet,
    getRenderedPaymentInstruments: base.getRenderedPaymentInstruments,
    sendConfirmationEmail: sendConfirmationEmail,
    ensureValidShipments: base.ensureValidShipments,
    setGift: base.setGift,
    getRenderedPaymentInstrumentsForRedirect: getRenderedPaymentInstrumentsForRedirect,
    deleteSessionOrderNum: deleteSessionOrderNum,
    executeOrderProcess: executeOrderProcess,
    authStatusOrderPlacement: authStatusOrderPlacement,
    pendingStatusOrderPlacement: pendingStatusOrderPlacement,
    deletWPToken: deletWPToken,
    authenticationRequest3DsOutcome: authenticationRequest3DsOutcome
};
