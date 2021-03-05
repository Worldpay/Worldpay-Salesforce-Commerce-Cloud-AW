'use strict';

var page = module.superModule;
var server = require('server');
server.extend(page);

var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var userLoggedIn = require('*/cartridge/scripts/middleware/userLoggedIn');

server.prepend('SavePayment', csrfProtection.validateAjaxRequest, function (req, res) {
    var formErrors = require('*/cartridge/scripts/formErrors');
    var accountHelpers = require('*/cartridge/scripts/account/accountHelpers');
    var HookMgr = require('dw/system/HookMgr');

    var paymentForm = server.forms.getForm('creditCard');
    var result = accountHelpers.getDetailsObject(paymentForm);

    if (paymentForm.valid && !accountHelpers.verifyCard(result, paymentForm)) {
        res.setViewData(result);
        var URLUtils = require('dw/web/URLUtils');
        var CustomerMgr = require('dw/customer/CustomerMgr');

        var formInfo = res.getViewData();
        var customer = CustomerMgr.getCustomerByCustomerNumber(
            req.currentCustomer.profile.customerNo
        );
        var paymentInstrument = {
            creditCardHolder: formInfo.name,
            creditCardNumber: formInfo.cardNumber,
            creditCardType: formInfo.cardType,
            creditCardExpirationMonth: formInfo.expirationMonth,
            creditCardExpirationYear: formInfo.expirationYear
        };
        var PaymentMgr = require('dw/order/PaymentMgr');
        var PaymentInstrument = require('dw/order/PaymentInstrument');
        var paymentProcessor = PaymentMgr.getPaymentMethod(PaymentInstrument.METHOD_CREDIT_CARD).paymentProcessor;
        if (HookMgr.hasHook('app.payment.processor.' +
                paymentProcessor.ID.toLowerCase())) {
            var updateTokenResult = HookMgr.callHook(
                    'app.payment.processor.' + paymentProcessor.ID.toLowerCase(),
                    'UpdateToken',
                    paymentInstrument,
                    customer
                );
            if (!updateTokenResult.error) {
                res.json({
                    success: true,
                    redirectUrl: URLUtils.url('PaymentInstruments-List').toString()
                });
            } else if (updateTokenResult.error && updateTokenResult.verfied === false) {
                res.json({
                    success: false,
                    verfied: false

                });
            } else if (updateTokenResult.error && updateTokenResult.tokenConflict) {
                res.json({
                    success: false,
                    tokenConflict: true

                });
            } else if (updateTokenResult.error && updateTokenResult.servererror) {
                res.json({
                    success: false,
                    servererror: true

                });
            } else if (updateTokenResult.error && updateTokenResult.updateLimitCrossed) {
                res.json({
                    success: false,
                    updateLimitCrossed: true

                });
            }
        }
    } else {
        res.json({
            success: false,
            fields: formErrors.getFormErrors(paymentForm)
        });
    }
    this.emit('route:Complete', req, res);
});

server.prepend('DeletePayment', userLoggedIn.validateLoggedInAjax, function (req, res) {
    var array = require('*/cartridge/scripts/util/array');
    var ServiceFacade = require('*/cartridge/scripts/service/serviceFacade');

    var data = res.getViewData();
    if (data && !data.loggedin) {
        res.json();
        this.emit('route:Complete', req, res);
        return;
    }

    var UUID = req.querystring.UUID;
    var paymentInstruments = req.currentCustomer.wallet.paymentInstruments;
    var paymentToDelete = array.find(paymentInstruments, function (item) {
        return UUID === item.UUID;
    });
    res.setViewData(paymentToDelete);
    var CustomerMgr = require('dw/customer/CustomerMgr');
    var Transaction = require('dw/system/Transaction');
    var Resource = require('dw/web/Resource');
    var payment = res.getViewData();
    var customer = CustomerMgr.getCustomerByCustomerNumber(
        req.currentCustomer.profile.customerNo
    );
    var wallet = customer.getProfile().getWallet();
    var cToken = payment.raw.custom.awpCCTokenData;
    if (cToken && cToken !== 'undefined') {
        ServiceFacade.deleteToken(cToken);
    }
    Transaction.wrap(function () {
        wallet.removePaymentInstrument(payment.raw);
    });
    if (wallet.getPaymentInstruments().length === 0) {
        res.json({
            UUID: UUID,
            message: Resource.msg('msg.no.saved.payments', 'payment', null)
        });
    } else {
        res.json({ UUID: UUID });
    }
    this.emit('route:Complete', req, res);
});

module.exports = server.exports();
