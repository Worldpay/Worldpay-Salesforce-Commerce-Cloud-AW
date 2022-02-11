/* eslint-disable consistent-return */
'use strict';

var Status = require('dw/system/Status');
var Transaction = require('dw/system/Transaction');
var applePayHelpers = require('*/cartridge/scripts/checkout/applePayHelpers');

exports.authorizeOrderPayment = function (order, responseData) {
    var Logger = require('dw/system/Logger');
    var LibCreateRequest = require('*/cartridge/scripts/lib/libCreateRequest');
    var ApplePayHookResult = require('dw/extensions/applepay/ApplePayHookResult');
    var Utils = require('*/cartridge/scripts/common/utils');
    var WorldpayPreferences = require('*/cartridge/scripts/object/worldpayPreferences');
    var paymentMethodID = 'DW_APPLE_PAY';
    var WorldpayConstants = require('*/cartridge/scripts/common/worldpayConstants');
    var worldPayPreferences = new WorldpayPreferences();
    var preferences = worldPayPreferences.worldPayPreferencesInit();
    var Site = require('dw/system/Site');
    var skipStateCodeValidation = Site.getCurrent().getCustomPreferenceValue('skipStateCodeAddressValidation');
    var URLUtils = require('dw/web/URLUtils');
    var serviceResponseHandler = require('*/cartridge/scripts/service/serviceResponseHandler');

    var error = new Status(Status.ERROR);
    var success = new Status(Status.OK);
    var isBillingAddressError;
    if (skipStateCodeValidation) {
        isBillingAddressError = applePayHelpers.validateBillingFields(responseData);
    } else {
        isBillingAddressError = applePayHelpers.validateUSBillingFields(responseData);
    }
    if (isBillingAddressError.error) {
        error.addDetail(ApplePayHookResult.STATUS_REASON_DETAIL_KEY, ApplePayHookResult.REASON_BILLING_ADDRESS);
        return error;
    }

    applePayHelpers.setAddress(responseData.payment.billingContact, 'billing');
    applePayHelpers.setAddress(responseData.payment.shippingContact, 'shipping');

    var paymentMethod = require('dw/order/PaymentMgr').getPaymentMethod(paymentMethodID);
    Transaction.wrap(function () {
        var paymentInstrument = null;
        if (order.getPaymentInstruments()) {
            paymentInstrument = order.getPaymentInstruments()[0];
            paymentInstrument.paymentTransaction.paymentProcessor = paymentMethod.getPaymentProcessor();
        } else {
            return error;
        }
        paymentInstrument.paymentTransaction.paymentProcessor = paymentMethod.getPaymentProcessor();
    });

    var result = null;
    if (responseData && responseData.payment) {
        var requestHeader = { 'Content-Type': 'application/vnd.worldpay.payments-v6+json' };
        var requestObject = LibCreateRequest.createApplePayAuthRequest(order, responseData);
        result = Utils.serviceCallAWP(requestObject, requestHeader, preferences, WorldpayConstants.PAYMENT_SERVICE_ID, preferences.getAPIEndpoint('payments', 'authorization'));
        var handleResult = serviceResponseHandler.validateServiceResponse(result);
        if (handleResult && Object.prototype.hasOwnProperty.call(handleResult, 'error') && handleResult.error) {
            if (handleResult.errorCode === 'narrativeERROR') {
                session.privacy.narrativeError = true;
                Logger.getLogger('worldpay').error('Redirecting from applePayAuth.js to Cart-Show : error = narrativeERROR');
                return URLUtils.url('Cart-Show', 'placeerror', 'narrativeERROR');
            } else if (handleResult.errorCode === 'entityERROR') {
                Logger.getLogger('worldpay').error('Redirecting from applePayAuth.js to Cart-Show : error = entityERROR');
                return URLUtils.url('Cart-Show', 'placeerror', 'entityERROR');
            } else if (handleResult.errorCode === 'cvvError') {
                Logger.getLogger('worldpay').error('Redirecting from applePayAuth.js to Cart-Show : error = cvvError');
                return URLUtils.url('Cart-Show', 'placeerror', 'cvvError');
            }
            Logger.getLogger('worldpay').error('Redirecting from applePayAuth.js to Cart-Show : error = cartError');
            return URLUtils.url('Cart-Show', 'placeerror', 'cartError');
        }
    }
    var hasError = applePayHelpers.handleAuthResponse(result);

    if (result && result.ok && !hasError) {
        var parsedResponse = Utils.parseResponse(result.object);
        var worldpayPayment = require('*/cartridge/scripts/order/worldpayPayment');
        worldpayPayment.setURLs(parsedResponse, order);
        return success;
    }
};

exports.shippingContactSelected = function (basket, event) {
    var ApplePayHookResult = require('dw/extensions/applepay/ApplePayHookResult');
    var error = new Status(Status.ERROR);
    var Site = require('dw/system/Site');
    var skipStateCodeValidation = Site.getCurrent().getCustomPreferenceValue('skipStateCodeAddressValidation');
    var hasShippingAddressError;
    if (skipStateCodeValidation) {
        hasShippingAddressError = applePayHelpers.validateShippingFields(event.shippingContact);
    } else {
        hasShippingAddressError = applePayHelpers.validateUSShippingFields(event.shippingContact);
    }
    // validates the shipping address some mac devices allow address without country code
    if (hasShippingAddressError.error) {
        error.addDetail(ApplePayHookResult.STATUS_REASON_DETAIL_KEY, ApplePayHookResult.REASON_SHIPPING_ADDRESS);
        return new ApplePayHookResult(error, null);
    }
};

exports.placeOrder = function (order) {
    var URLUtils = require('dw/web/URLUtils');
    var ApplePayHookResult = require('dw/extensions/applepay/ApplePayHookResult');
    // order placement will happen in the redirected controller
    var url = URLUtils.url('COPlaceOrder-SubmitOrder', 'order_id', order.orderNo, 'order_token', order.getOrderToken());
    return new ApplePayHookResult(new Status(Status.OK), url);
};
