'use strict';

var page = module.superModule;
var server = require('server');
var BasketMgr = require('dw/order/BasketMgr');
var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var Resource = require('dw/web/Resource');
server.extend(page);

/**
 * CheckoutServices-SubmitPayment : The CheckoutServices-SubmitPayment endpoint will submit the payment information and render the checkout place order page allowing the shopper to confirm and place the order
 * @name Base/CheckoutServices-SubmitPayment
 * @function
 * @memberof CheckoutServices
 * @param {middleware} - server.middleware.https
 * @param {middleware} - csrfProtection.validateAjaxRequest
 * @param {httpparameter} - addressSelector - For Guest shopper: A shipment UUID that contains address that matches the selected address. For returning shopper: ab_<address-name-from-address-book>" of the selected address. For both type of shoppers:  "new" if a brand new address is entered
 * @param {httpparameter} - dwfrm_billing_addressFields_firstName - Input field for the shoppers's first name
 * @param {httpparameter} - dwfrm_billing_addressFields_lastName - Input field for the shoppers's last name
 * @param {httpparameter} - dwfrm_billing_addressFields_address1 - Input field for the shoppers's address 1 - street
 * @param {httpparameter} - dwfrm_billing_addressFields_address2 - Input field for the shoppers's address 2 - street
 * @param {httpparameter} - dwfrm_billing_addressFields_country - Input field for the shoppers's address - country
 * @param {httpparameter} - dwfrm_billing_addressFields_states_stateCode - Input field for the shoppers's address - state code
 * @param {httpparameter} - dwfrm_billing_addressFields_city - Input field for the shoppers's address - city
 * @param {httpparameter} - dwfrm_billing_addressFields_postalCode - Input field for the shoppers's address - postal code
 * @param {httpparameter} - csrf_token - hidden input field CSRF token
 * @param {httpparameter} - localizedNewAddressTitle - label for new address
 * @param {httpparameter} - dwfrm_billing_contactInfoFields_email - Input field for the shopper's email address
 * @param {httpparameter} - dwfrm_billing_contactInfoFields_phone - Input field for the shopper's phone number
 * @param {httpparameter} - dwfrm_billing_paymentMethod - Input field for the shopper's payment method
 * @param {httpparameter} - dwfrm_billing_creditCardFields_cardType - Input field for the shopper's credit card type
 * @param {httpparameter} - dwfrm_billing_creditCardFields_cardNumber - Input field for the shopper's credit card number
 * @param {httpparameter} - dwfrm_billing_creditCardFields_expirationMonth - Input field for the shopper's credit card expiration month
 * @param {httpparameter} - dwfrm_billing_creditCardFields_expirationYear - Input field for the shopper's credit card expiration year
 * @param {httpparameter} - dwfrm_billing_creditCardFields_securityCode - Input field for the shopper's credit card security code
 * @param {category} - sensitive
 * @param {returns} - json
 * @param {serverfunction} - post
 */
server.prepend(
    'SubmitPayment',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    function (req, res) {
        var paymentForm = server.forms.getForm('billing');
        var billingFormErrors = {};
        var creditCardErrors = {};
        var paymentFieldErrors = {};
        var savedCardErrors = null;
        var paramMap = request.httpParameterMap;
        var Site = require('dw/system/Site');
        var WorldpayPayment = require('*/cartridge/scripts/order/worldpayPayment');
        var worldpayConstants = require('*/cartridge/scripts/common/worldpayConstants');
        var ccSecurityModel = Site.current.getCustomPreferenceValue('ccSecurityModel').value;
        var Logger = require('dw/system/Logger');
        var isCVVDisabled = Site.getCurrent().getCustomPreferenceValue('isAWPCvvDisabled');

        var viewData = {};
        // verify billing form data
        billingFormErrors = COHelpers.validateBillingForm(paymentForm.addressFields);

        if (!req.form.storedPaymentUUID && paymentForm.paymentMethod.value.equals('CREDIT_CARD') && ccSecurityModel === 'DIRECT') {
            // verify credit card form data
            if (!paymentForm.creditCardFields.encryptedData || !paymentForm.creditCardFields.encryptedData.value) {
                creditCardErrors = COHelpers.validateFields(paymentForm.creditCardFields);
                if (!paymentForm.paymentMethod.value) {
                    if (BasketMgr.getCurrentBasket().totalGrossPrice.value > 0) {
                        creditCardErrors[paymentForm.paymentMethod.htmlName] = Resource.msg('error.no.selected.payment.method', 'creditCard', null);
                    }
                }
            }
        }
        if (paymentForm.paymentMethod.value.equals(worldpayConstants.ACHPAY)) {
            paymentFieldErrors = COHelpers.validateFields(paymentForm.achFields);
        }
        var contactInfoFormErrors = COHelpers.validateFields(paymentForm.contactInfoFields);

        if (paymentForm.paymentMethod.value.equals('CREDIT_CARD') && ccSecurityModel === 'WEB_SDK' && req.form.storedPaymentUUID && !isCVVDisabled && !session.privacy.cvvSessionHref) {
            savedCardErrors = Resource.msg('error.message.security.code.required', 'checkout', null);
        }
        if (!req.form.storedPaymentUUID && session.privacy.cvvSessionHref) {
            Logger.getLogger('worldpay').debug('Cleared orphan cvv href from session');
            delete session.privacy.cvvSessionHref;
        }
        if (Object.keys(paymentFieldErrors).length) {
            Object.keys(paymentFieldErrors).forEach(function (innerKey) {
                creditCardErrors[innerKey] = paymentFieldErrors[innerKey];
            });
        }
        if (Object.keys(billingFormErrors).length || Object.keys(creditCardErrors).length || Object.keys(contactInfoFormErrors).length || savedCardErrors) {
            // respond with form data and errors
            res.json({
                form: paymentForm,
                fieldErrors: [billingFormErrors, creditCardErrors, contactInfoFormErrors],
                serverErrors: savedCardErrors ? [savedCardErrors] : [],
                error: true
            });
        } else {
            viewData.address = {
                firstName: { value: paymentForm.addressFields.firstName.value },
                lastName: { value: paymentForm.addressFields.lastName.value },
                address1: { value: paymentForm.addressFields.address1.value },
                address2: { value: paymentForm.addressFields.address2.value },
                city: { value: paymentForm.addressFields.city.value },
                postalCode: { value: paymentForm.addressFields.postalCode.value },
                countryCode: { value: paymentForm.addressFields.country.value }
            };

            if (Object.prototype.hasOwnProperty.call(paymentForm.addressFields, 'states')) {
                viewData.address.stateCode = {
                    value: paymentForm.addressFields.states.stateCode.value
                };
            }

            viewData.paymentMethod = {
                value: paymentForm.paymentMethod.value,
                htmlName: paymentForm.paymentMethod.value
            };

            viewData.paymentInformation = {
                selectedPaymentMethodID: {
                    value: paymentForm.paymentMethod.value,
                    htmlName: paymentForm.paymentMethod.value
                },
                disclaimerCcDirect: {
                    value: paramMap.disclaimer.rawValue
                },
                disclaimerWCSdk: {
                    value: paramMap.disclaimer_csdk.rawValue
                },
                cardType: {
                    value: paymentForm.creditCardFields.cardType.value,
                    htmlName: paymentForm.creditCardFields.cardType.htmlName
                },
                cardOwner: {
                    value: paymentForm.creditCardFields.cardOwner.value,
                    htmlName: paymentForm.creditCardFields.cardOwner.htmlName
                },
                cardNumber: {
                    value: paymentForm.creditCardFields.cardNumber.value,
                    htmlName: paymentForm.creditCardFields.cardNumber.htmlName
                },
                securityCode: {
                    value: paymentForm.creditCardFields.securityCode.value,
                    htmlName: paymentForm.creditCardFields.securityCode.htmlName
                },
                expirationMonth: {
                    value: parseInt(
                        paymentForm.creditCardFields.expirationMonth.selectedOption,
                        10
                    ),
                    htmlName: paymentForm.creditCardFields.expirationMonth.htmlName
                },
                expirationYear: {
                    value: parseInt(paymentForm.creditCardFields.expirationYear.value, 10),
                    htmlName: paymentForm.creditCardFields.expirationYear.htmlName
                },
                encryptedData: {
                    value: paymentForm.creditCardFields.encryptedData.value,
                    htmlName: paymentForm.creditCardFields.encryptedData.htmlName
                },
                preferredCard: {
                    value: paymentForm.creditCardFields.cards.value,
                    htmlName: paymentForm.creditCardFields.cards.htmlName
                },
                tokenID: {
                    value: ''
                },
                tokenExp: {
                    value: ''
                },
                tokenPI: {
                    value: ''
                },
                achFields: {
                    achAccountType: {
                        value: paymentForm.achFields.accountType.value,
                        htmlName: paymentForm.achFields.accountType.htmlName
                    },
                    achAccountNumber: {
                        value: paymentForm.achFields.accountNumber.value,
                        htmlName: paymentForm.achFields.accountNumber.htmlName
                    },
                    achRoutingNumber: {
                        value: paymentForm.achFields.routingNumber.value,
                        htmlName: paymentForm.achFields.routingNumber.htmlName
                    },
                    achCheckNumber: {
                        value: paymentForm.achFields.checkNumber.value,
                        htmlName: paymentForm.achFields.checkNumber.htmlName
                    },
                    achCompanyName: {
                        value: paymentForm.achFields.accountType.value && (paymentForm.achFields.accountType.value.toString().toLowerCase() === worldpayConstants.CORPORATE || paymentForm.achFields.accountType.value.toString().toLowerCase() === worldpayConstants.CORPSAVINGS) ? paymentForm.achFields.companyName.value : '',
                        htmlName: paymentForm.achFields.companyName.htmlName
                    }
                }

            };

            if (req.form.storedPaymentUUID) {
                viewData.storedPaymentUUID = req.form.storedPaymentUUID;
            }

            if (req.form.securityCode && req.form.securityCode !== 'undefined') {
                paymentForm.creditCardFields.securityCode.value = req.form.securityCode;
            }

            viewData.phone = { value: paymentForm.contactInfoFields.phone.value };

            viewData.saveCard = paymentForm.creditCardFields.saveCard.checked;
            // new card added and opted to save, no need delete the token
            if (paymentForm.creditCardFields.saveCard.checked) {
                delete session.privacy.clearToken;
            }
            var currentBasket = BasketMgr.getCurrentBasket();
            var Utils = require('*/cartridge/scripts/common/utils');
            var paymentPrice = Utils.calculateNonGiftCertificateAmountFromBasket(currentBasket);
            viewData.paymentInformation.paymentPrice = paymentPrice;
            if (viewData.paymentMethod.value === 'CREDIT_CARD' && ccSecurityModel === 'WEB_SDK' && !viewData.storedPaymentUUID) {
                var serviceResult = WorldpayPayment.enquireToken();
                if (serviceResult.success) {
                    viewData.paymentInformation.cardOwner.value = serviceResult.enquireServiceResult.serviceresponse.webCSDKCCHolderName;
                    viewData.paymentInformation.cardNumber.value = serviceResult.enquireServiceResult.serviceresponse.webCSDKCCNumber;
                    viewData.paymentInformation.cardType.value = serviceResult.enquireServiceResult.serviceresponse.webCSDKCCType;
                            // viewData.paymentInformation.securityCode.value = req.form.securityCode;
                    viewData.paymentInformation.expirationMonth.value = serviceResult.enquireServiceResult.serviceresponse.webCSDKCCExpMonth;
                    viewData.paymentInformation.expirationYear.value = serviceResult.enquireServiceResult.serviceresponse.webCSDKCCExpYear;
                    viewData.paymentInformation.tokenID.value = serviceResult.enquireServiceResult.serviceresponse.tokenId;
                    viewData.paymentInformation.tokenExp.value = serviceResult.enquireServiceResult.serviceresponse.tokenExpiryDateTime;
                    viewData.paymentInformation.tokenPI.value = serviceResult.enquireServiceResult.serviceresponse.tokenPaymentInstrument;
                }
            }

            res.setViewData(viewData);
            var HookMgr = require('dw/system/HookMgr');
            var PaymentMgr = require('dw/order/PaymentMgr');
            var Transaction = require('dw/system/Transaction');
            var AccountModel = require('*/cartridge/models/account');
            var OrderModel = require('*/cartridge/models/order');
            var URLUtils = require('dw/web/URLUtils');
            var array = require('*/cartridge/scripts/util/array');
            var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
            var billingData = res.getViewData();
            if (!currentBasket) {
                delete billingData.paymentInformation;
                Logger.getLogger('worldpay').error('Redirecting from CheckoutServices-SubmitPayment to Cart-Show : cartError = true');
                res.json({
                    error: true,
                    cartError: true,
                    fieldErrors: [],
                    serverErrors: [],
                    redirectUrl: URLUtils.url('Cart-Show').toString()
                });
                this.emit('route:Complete', req, res);
                return;
            }
            var billingAddress = currentBasket.billingAddress;
            var billingForm = server.forms.getForm('billing');
            var paymentMethodID = billingData.paymentMethod.value;
            var result;
            billingForm.creditCardFields.cardNumber.htmlValue = '';
            billingForm.creditCardFields.securityCode.htmlValue = '';

            Transaction.wrap(function () {
                if (!billingAddress) {
                    billingAddress = currentBasket.createBillingAddress();
                }

                billingAddress.setFirstName(billingData.address.firstName.value);
                billingAddress.setLastName(billingData.address.lastName.value);
                billingAddress.setAddress1(billingData.address.address1.value);
                billingAddress.setAddress2(billingData.address.address2.value);
                billingAddress.setCity(billingData.address.city.value);
                billingAddress.setPostalCode(billingData.address.postalCode.value);
                if (Object.prototype.hasOwnProperty.call(billingData.address, 'stateCode')) {
                    billingAddress.setStateCode(billingData.address.stateCode.value);
                }
                billingAddress.setCountryCode(billingData.address.countryCode.value);

                billingAddress.setPhone(billingData.phone.value);
            });

            // if there is no selected payment option and balance is greater than zero
            if (!paymentMethodID && currentBasket.totalGrossPrice.value > 0) {
                var noPaymentMethod = {};

                noPaymentMethod[billingData.paymentMethod.htmlName] = Resource.msg('error.no.selected.payment.method', 'creditCard', null);

                delete billingData.paymentInformation;

                res.json({
                    form: billingForm,
                    fieldErrors: [noPaymentMethod],
                    serverErrors: [],
                    error: true
                });
                this.emit('route:Complete', req, res);
                return;
            }

            // check to make sure there is a payment processor
            if (!PaymentMgr.getPaymentMethod(paymentMethodID).paymentProcessor) {
                throw new Error(Resource.msg(
                    'error.payment.processor.missing',
                    'checkout',
                    null
                ));
            }

            var processor = PaymentMgr.getPaymentMethod(paymentMethodID).getPaymentProcessor();

            if (paymentMethodID === 'CREDIT_CARD' && billingData.storedPaymentUUID
                && req.currentCustomer.raw.authenticated
                && req.currentCustomer.raw.registered) {
                var paymentInstruments = req.currentCustomer.wallet.paymentInstruments;
                var paymentInstrument = array.find(paymentInstruments, function (item) {
                    return billingData.storedPaymentUUID === item.UUID;
                });

                if (!paymentInstrument) {
                    var utils = require('*/cartridge/scripts/common/utils');
                    var savedCardNotFoundError = utils.getConfiguredLabel('worldpay.error.saved.card.not.found', 'worldpayError');
                    res.json({
                        error: true,
                        fieldErrors: [],
                        serverErrors: [savedCardNotFoundError]
                    });
                    this.emit('route:Complete', req, res);
                    return;
                }

                billingData.paymentInformation.cardOwner.value = paymentInstrument.creditCardHolder;
                billingData.paymentInformation.cardNumber.value = paymentInstrument.creditCardNumber;
                billingData.paymentInformation.cardType.value = paymentInstrument.creditCardType;
                billingData.paymentInformation.securityCode.value = (req.form.securityCode && req.form.securityCode !== 'undefined') ? req.form.securityCode : '';
                billingData.paymentInformation.expirationMonth.value = paymentInstrument.creditCardExpirationMonth;
                billingData.paymentInformation.expirationYear.value = paymentInstrument.creditCardExpirationYear;
                billingData.paymentInformation.creditCardToken = paymentInstrument.raw.creditCardToken;
                billingData.paymentInformation.creditCardTokenData = paymentInstrument.raw.custom.awpCCTokenData;
                billingData.paymentInformation.creditCardTokenExpiry = paymentInstrument.raw.custom.awpCCTokenExpiry;
            }

            if (HookMgr.hasHook('app.payment.processor.' + processor.ID.toLowerCase())) {
                result = HookMgr.callHook('app.payment.processor.' + processor.ID.toLowerCase(),
                    'Handle',
                    currentBasket,
                    billingData.paymentInformation,
                    paymentMethodID,
                    req
                );
            } else {
                result = HookMgr.callHook('app.payment.processor.default', 'Handle');
            }

            // need to invalidate credit card fields
            if (result.error) {
                delete billingData.paymentInformation;

                res.json({
                    form: billingForm,
                    fieldErrors: result.fieldErrors,
                    serverErrors: result.serverErrors,
                    error: true
                });
                this.emit('route:Complete', req, res);
                return;
            }

            // Calculate the basket
            Transaction.wrap(function () {
                basketCalculationHelpers.calculateTotals(currentBasket);
            });

            // Re-calculate the payments.
            var calculatedPaymentTransaction = COHelpers.calculatePaymentTransaction(
                currentBasket
            );

            if (calculatedPaymentTransaction.error) {
                res.json({
                    form: paymentForm,
                    fieldErrors: [],
                    serverErrors: [Resource.msg('error.technical', 'checkout', null)],
                    error: true
                });
                this.emit('route:Complete', req, res);
                return;
            }

            var usingMultiShipping = req.session.privacyCache.get('usingMultiShipping');
            if (usingMultiShipping === true && currentBasket.shipments.length < 2) {
                req.session.privacyCache.set('usingMultiShipping', false);
                usingMultiShipping = false;
            }

            var basketModel = new OrderModel(
                currentBasket,
                { usingMultiShipping: usingMultiShipping, countryCode: billingData.address.countryCode.value, containerView: 'basket' }
            );

            var accountModel = new AccountModel(req.currentCustomer);
            var renderedStoredPaymentInstrument = COHelpers.getRenderedPaymentInstruments(
                req,
                accountModel
            );


            delete billingData.paymentInformation;
            if (basketModel.billing.payment.selectedPaymentInstruments
                && basketModel.billing.payment.selectedPaymentInstruments.length > 0 && !basketModel.billing.payment.selectedPaymentInstruments[0].type) {
                basketModel.resources.cardType = Resource.msg('worldpay.payment.type.selectedmethod', 'worldpay', null) + ' ' + basketModel.billing.payment.selectedPaymentInstruments[0].paymentMethodName;
                basketModel.billing.payment.selectedPaymentInstruments[0].type = '';
            }
            if (basketModel.billing.payment.selectedPaymentInstruments
                && basketModel.billing.payment.selectedPaymentInstruments.length > 0 && !basketModel.billing.payment.selectedPaymentInstruments[0].maskedCreditCardNumber) {
                basketModel.billing.payment.selectedPaymentInstruments[0].maskedCreditCardNumber = '';
            }
            if (basketModel.billing.payment.selectedPaymentInstruments
                && basketModel.billing.payment.selectedPaymentInstruments.length > 0 && !basketModel.billing.payment.selectedPaymentInstruments[0].expirationMonth) {
                basketModel.resources.cardEnding = Resource.msg('worldpay.payment.amount', 'worldpay', null) + ' ' + basketModel.billing.payment.selectedPaymentInstruments[0].amountFormatted;
                basketModel.billing.payment.selectedPaymentInstruments[0].expirationMonth = '';
                basketModel.billing.payment.selectedPaymentInstruments[0].expirationYear = '';
            }
            res.json({
                renderedPaymentInstruments: renderedStoredPaymentInstrument,
                customer: accountModel,
                order: basketModel,
                form: billingForm,
                error: false
            });
        }
        this.emit('route:Complete', req, res);
    }
);

module.exports = server.exports();
