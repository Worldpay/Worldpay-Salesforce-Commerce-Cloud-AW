'use strict';

var server = require('server');
var Status = require('dw/system/Status');
var PaymentInstrument = require('dw/order/PaymentInstrument');
var WorldpayConstants = require('*/cartridge/scripts/common/worldpayConstants');
var WorldpayPayment = require('*/cartridge/scripts/order/worldpayPayment');
var CardHelper = require('*/cartridge/scripts/common/cardHelper');


/**
 * Verifies that entered payment information is a valid. If the information is valid payment instrument is created
 * @param {dw.order.Basket} basket Current users's basket
 * @param {Object} pi - the payment information
 * @param {string} paymentMethodID - Payment Method ID
 * @param {Object} req - req object
 * @return {Object} returns an error object
 */
function handle(basket, pi, paymentMethodID, req) {
    var paymentInformation = pi;
    var PaymentStatusCodes = require('dw/order/PaymentStatusCodes');
    var PaymentMgr = require('dw/order/PaymentMgr');
    var Resource = require('dw/web/Resource');
    var Site = require('dw/system/Site');
    var ccSecurityModel = Site.current.getCustomPreferenceValue('ccSecurityModel').value;
    var paymentforms;
    var cardErrors = {};
    var cardSecurityCode;
    var paymentCard;
    var regex;
    var regexAmex;
    var cardType;
    var creditCardStatus = {};
    var paymentMethod = paymentInformation.selectedPaymentMethodID.value;
    paymentInformation.paymentPrice = basket.totalGrossPrice;

    // Validate payment instrument
    if (paymentMethodID === PaymentInstrument.METHOD_CREDIT_CARD) {
        var worldpayCardType;
        var creditCardPaymentMethod = PaymentMgr.getPaymentMethod(PaymentInstrument.METHOD_CREDIT_CARD);
        if (ccSecurityModel === 'DIRECT') {
            worldpayCardType = paymentInformation.cardType.value;
        } else if (ccSecurityModel === 'WEB_SDK') {
            worldpayCardType = CardHelper.getCardType(paymentInformation.cardType.value.toUpperCase());
        }
        var paymentCardValue = PaymentMgr.getPaymentCard(worldpayCardType);
        var applicablePaymentCards = creditCardPaymentMethod.getApplicablePaymentCards(
            req.currentCustomer.raw,
            req.geolocation.countryCode,
            null
        );

        if (!applicablePaymentCards.contains(paymentCardValue)) {
            // Invalid Payment Instrument
            var invalidPaymentMethod = Resource.msg('error.payment.not.valid', 'checkout', null);
            return { fieldErrors: [], serverErrors: [invalidPaymentMethod], error: true };
        }
    }

    if (paymentMethod && paymentMethod.equals(PaymentInstrument.METHOD_CREDIT_CARD) && ccSecurityModel === 'DIRECT') {
        paymentforms = server.forms.getForm('billing').creditCardFields;
        if (paymentforms.saveCard && paymentforms.saveCard.value &&
            (paymentInformation.disclaimerCcDirect.value === 'yes' || paymentInformation.disclaimerCcDirect.value == null)) {
            paymentInformation.saveCard = {
                value: paymentforms.saveCard.value,
                htmlName: paymentforms.saveCard.htmlName
            };
        }
        if (!paymentInformation.cardOwner.value) {
            paymentInformation.cardOwner.value = paymentforms.cardOwner.value;
        }
        var cardNumber = paymentInformation.cardNumber.value;
        cardSecurityCode = paymentInformation.securityCode.value;
        var expirationMonth = paymentInformation.expirationMonth.value;
        var expirationYear = paymentInformation.expirationYear.value;
        var encryptedData = paymentInformation.encryptedData.value;

        var serverErrors = [];
        creditCardStatus = {};
        cardType = paymentInformation.cardType.value;
        paymentCard = PaymentMgr.getPaymentCard(cardType);
        var isCvvDisabled = Site.getCurrent().getCustomPreferenceValue('isAWPCvvDisabled');
        regex = /^([0-9]{3})$/;
        regexAmex = /^([0-9]{4})$/;

        if (paymentCard) {
            if (!paymentInformation.creditCardToken && !encryptedData) {
                if (!isCvvDisabled) {
                    creditCardStatus = paymentCard.verify(
                    expirationMonth,
                    expirationYear,
                    cardNumber,
                    cardSecurityCode
                    );
                }
                if (isCvvDisabled) {
                    if (cardSecurityCode) {
                        creditCardStatus = paymentCard.verify(
                        expirationMonth,
                        expirationYear,
                        cardNumber,
                        cardSecurityCode
                        );
                    } else {
                        creditCardStatus = paymentCard.verify(
                                expirationMonth,
                                expirationYear,
                                cardNumber
                                );
                    }
                }
            } else if (paymentInformation.creditCardToken && (!isCvvDisabled || (isCvvDisabled && cardSecurityCode))) {
                if (!regex.test(cardSecurityCode) && !cardType.equalsIgnoreCase('AMEX')) {
                    creditCardStatus = new Status(Status.ERROR, PaymentStatusCodes.CREDITCARD_INVALID_SECURITY_CODE);
                }
                if (!regexAmex.test(cardSecurityCode) && cardType.equalsIgnoreCase('AMEX')) {
                    creditCardStatus = new Status(Status.ERROR, PaymentStatusCodes.CREDITCARD_INVALID_SECURITY_CODE);
                }
            }
        } else {
            creditCardStatus = {
                error: true,
                cardUnknown: true
            };
        }

        if (!creditCardStatus.error && (!isCvvDisabled || (isCvvDisabled && cardSecurityCode))) {
            if (!regex.test(cardSecurityCode) && !cardType.equalsIgnoreCase('AMEX')) {
                creditCardStatus = new Status(Status.ERROR, PaymentStatusCodes.CREDITCARD_INVALID_SECURITY_CODE);
            }
            if (!regexAmex.test(cardSecurityCode) && cardType.equalsIgnoreCase('AMEX')) {
                creditCardStatus = new Status(Status.ERROR, PaymentStatusCodes.CREDITCARD_INVALID_SECURITY_CODE);
            }
        }
        if (creditCardStatus.error) {
            if (!(creditCardStatus instanceof Status) && creditCardStatus.cardUnknown) {
                cardErrors[paymentInformation.cardNumber.htmlName] =
                    Resource.msg('error.invalid.card.number', 'creditCard', null);
            } else if (creditCardStatus.items) {
                var item;
                for (var k = 0; k < creditCardStatus.items.length; k++) {
                    item = creditCardStatus.items[k];
                    switch (item.code) {
                        case PaymentStatusCodes.CREDITCARD_INVALID_CARD_NUMBER:
                            cardErrors[paymentInformation.cardNumber.htmlName] =
                                Resource.msg('error.invalid.card.number', 'creditCard', null);
                            break;

                        case PaymentStatusCodes.CREDITCARD_INVALID_EXPIRATION_DATE:
                            cardErrors[paymentInformation.expirationMonth.htmlName] =
                                Resource.msg('error.expired.credit.card', 'creditCard', null);
                            cardErrors[paymentInformation.expirationYear.htmlName] =
                                Resource.msg('error.expired.credit.card', 'creditCard', null);
                            break;

                        case PaymentStatusCodes.CREDITCARD_INVALID_SECURITY_CODE:
                            cardErrors[paymentInformation.securityCode.htmlName] =
                                Resource.msg('error.invalid.security.code', 'creditCard', null);
                            break;
                        default:
                            serverErrors.push(
                                Resource.msg('error.card.information.error', 'creditCard', null)
                            );
                    }
                }
            }
            return { fieldErrors: [cardErrors], serverErrors: serverErrors, error: true };
        }

        var cardHandleResult = WorldpayPayment.handleCreditCardAWP(basket, paymentInformation);
        if (cardHandleResult.error) {
            paymentforms.encryptedData = '';
        }
    } else if (paymentMethod && paymentMethod.equals(PaymentInstrument.METHOD_CREDIT_CARD) && ccSecurityModel === 'WEB_SDK') {
        paymentforms = server.forms.getForm('billing').creditCardFields;
        if (paymentforms.saveCard && paymentforms.saveCard.value &&
               (paymentInformation.disclaimerCcDirect.value === 'yes' || paymentInformation.disclaimerCcDirect.value == null)) {
            paymentInformation.saveCard = {
                value: paymentforms.saveCard.value,
                htmlName: paymentforms.saveCard.htmlName
            };
        }
        cardType = paymentInformation.cardType.value;
        creditCardStatus = {};
        paymentCard = PaymentMgr.getPaymentCard(cardType);
        return WorldpayPayment.handleWebSdk(basket, paymentInformation);
    } else if (paymentMethod != null) {
        return WorldpayPayment.handleAPM(basket, paymentInformation);
    }
    return '';
}


/**
 * Authorizes a payment using a credit card. Customizations may use other processors and custom
 *      logic to authorize credit card payment.
 * @param {number} orderNumber - The current order's number
 * @param {PaymentInstrument} paymentInstrument -  The payment instrument to authorize
 * @param {dw.order.PaymentProcessor} paymentProcessor -  The payment processor of the current payment method
 * @param {string} orderType - orderType eg. moto
 * @return {Object} returns an error object
 */
function authorize(orderNumber, paymentInstrument, paymentProcessor, orderType) {
    if (!paymentProcessor || !paymentProcessor.getID().equalsIgnoreCase(WorldpayConstants.WORLDPAY) || !paymentInstrument) {
        var errors = [];
        var Resource = require('dw/web/Resource');
        errors.push(Resource.msg('error.payment.processor.not.supported', 'checkout', null));
        return { fieldErrors: [], serverErrors: errors, error: true };
    }
    var paymentforms = server.forms.getForm('billing').creditCardFields;
    var cvn = '';
    if (paymentforms.securityCode && paymentforms.securityCode.htmlValue) {
        cvn = paymentforms.securityCode.value;
    } else if (session.privacy.motocvn) {
        cvn = session.privacy.motocvn;
        delete session.privacy.motocvn;
    }
    return WorldpayPayment.authorizeAWP(orderNumber, cvn, null, orderType);
}

/**
 * Update Token in payment Instrument for customer save payent instrument
 * @param {dw.order.PaymentInstrument} paymentInstrument -  The payment instrument to update token
 * @param {dw.customer.Customer} customer -  The customer where the token value to preseve in saved cards
 * @return {Object} returns an error object
 */
function updateToken(paymentInstrument, customer) {
    return WorldpayPayment.updateToken(paymentInstrument, customer);
}

/**
 * Initiate processor hook manager for worldpay order
 * @param {dw.order.Order} order - order object
 * @param {string} orderNumber - order number
 * @param {int} cvn - cvv number
 * @return {Object} returns a result object after the service call
 */
function handlemotoorder(order, orderNumber, cvn) {
    var result = {};
    var HookMgr = require('dw/system/HookMgr');
    var Transaction = require('dw/system/Transaction');
    var PaymentMgr = require('dw/order/PaymentMgr');
    var OrderMgr = require('dw/order/OrderMgr');

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
                    delete session.privacy.motocvn;
                    session.privacy.motocvn = cvn;
                    if (HookMgr.hasHook('app.payment.processor.' +
                        paymentProcessor.ID.toLowerCase())) {
                        authorizationResult = HookMgr.callHook(
                            'app.payment.processor.' + paymentProcessor.ID.toLowerCase(),
                            'Authorize',
                            orderNumber,
                            paymentInstrument,
                            paymentProcessor,
                            WorldpayConstants.MOTO_ORDER
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
 * Authorizes a payment using a credit card.
 * @param {Object} order - The current order
 * @param {Object} paymentDetails -  The payment paymentDetails to authorize
 * @param {number} cvn - cvn
 * @param {dw.order.PaymentProcessor} paymentProcessor -  The payment processor of the current
 *      payment method
 * @return {Object} returns a Status object
 */
function authorizeCreditCard(order, paymentDetails, cvn) {
    var result = handlemotoorder(order, order.currentOrderNo, cvn);
    var paymentProcessor = paymentDetails.paymentTransaction.paymentProcessor.ID;
    if (result.error) {
        var PaymentStatusCodes = require('dw/order/PaymentStatusCodes');
        return new Status(Status.ERROR, PaymentStatusCodes.CREDITCARD_INVALID_SECURITY_CODE, result.errorMessage);
    }
    var req = request;
    var localeid = (req.locale.id) ? req.locale.id : 'default';
    if (paymentProcessor === 'Worldpay') {
        var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
        COHelpers.sendConfirmationEmail(order, localeid);
    }
    return new Status(Status.OK);
}


/**
 * if PaymentMethod has a custom property 'csc_payment' the filter works automatically
 * @return {Object} returns a Status object
 * @param {string} paymentResponse - paymentMethod Result
 */
function modifyGETResponse(paymentResponse) {
    var paymentMethodResultResponse = paymentResponse;
    // We need to create a site preference then we will un comment the next line
    if (request.clientId === 'dw.csc') {
        var applicablePaymentMethods = [];
        // eslint-disable-next-line guard-for-in,no-restricted-syntax
        for (var index in paymentMethodResultResponse.applicablePaymentMethods) {
            var paymentMethod = paymentMethodResultResponse.applicablePaymentMethods[index];
            if (paymentMethod.id === 'CREDIT_CARD') {
                applicablePaymentMethods.push(paymentMethod);
            }
        }
        paymentMethodResultResponse.applicablePaymentMethods = applicablePaymentMethods;
    }
    return new Status(Status.OK);
}


exports.modifyGETResponse = modifyGETResponse;
exports.UpdateToken = updateToken;
exports.Handle = handle;
exports.Authorize = authorize;
exports.authorizeCreditCard = authorizeCreditCard;
