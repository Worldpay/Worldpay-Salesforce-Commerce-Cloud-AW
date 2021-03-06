'use strict';
var Resource = require('dw/web/Resource');
var PaymentMgr = require('dw/order/PaymentMgr');
var PaymentInstrument = require('dw/order/PaymentInstrument');
var array = require('*/cartridge/scripts/util/array');
var collections = require('*/cartridge/scripts/util/collections');
var WorldpayPreferences = require('*/cartridge/scripts/object/worldpayPreferences');
var WorldpayConstants = require('*/cartridge/scripts/common/worldpayConstants');

var RESOURCES = {
    addPaymentButton: Resource.msg('button.add.payment', 'checkout', null),
    backToStoredPaymentButton: Resource.msg('button.back.to.stored.payments', 'checkout', null),
    cardOwnerLabel: Resource.msg('label.input.creditcard.owner', 'forms', null),
    cardNumberLabel: Resource.msg('field.credit.card.number', 'creditCard', null),
    worldpayCardsLabel: Resource.msg('label.worldpay.cards', 'forms', null),
    expirationMonthLabel: Resource.msg('field.credit.card.expiration.month', 'creditCard', null),
    expirationYearLabel: Resource.msg('field.credit.card.expiration.year', 'creditCard', null),
    securityCodeLabel: Resource.msg('field.credit.card.security.code', 'creditCard', null),
    emailLabel: Resource.msg('field.customer.email', 'checkout', null),
    phoneLabel: Resource.msg('field.customer.phone.number', 'checkout', null),
    emailToolTip: Resource.msg('tooltip.email', 'creditCard', null),
    phoneToolTip: Resource.msg('tooltip.phone.number', 'creditCard', null),
    securityCodeToolTip: Resource.msg('tooltip.security.code', 'creditCard', null),
    clickHereLinkLabel: Resource.msg('worldpay.payment.clickhere', 'worldpay', null),
    cardOwnerToolTip: Resource.msg('tooltip.cardOwner', 'forms', null),
    cardNumberToolTip: Resource.msg('tooltip.cardNumber', 'forms', null),
    expirationMonthToolTip: Resource.msg('tooltip.expirationMonth', 'forms', null),
    expirationYearToolTip: Resource.msg('tooltip.expirationYear', 'forms', null),
    paymentByLabel: Resource.msg('worldpay.payment.type.selectedmethod', 'worldpay', null),
    amountLabel: Resource.msg('worldpay.payment.amount', 'worldpay', null)
};

/**
 * Creates an array of objects containing applicable credit cards
 * @param {dw.util.Collection<dw.order.PaymentCard>} paymentCards - An ArrayList of applicable
 *      payment cards that the user could use for the current basket.
 * @returns {Array} Array of objects that contain information about applicable payment cards for
 *      current basket.
 */
function applicablePaymentCards(paymentCards) {
    return collections.map(paymentCards, function (card) {
        return {
            cardType: card.cardType,
            name: card.name,
            displayValue: card.name
        };
    });
}

/**
 * Provide Preferred Cards list.
 * @param {Object} preferences - the associated worldpay preferences
 * @param {Object} paymentCards - the associated active PaymentCards as per customer country
 * @returns {Array} Array of objects that contain information about Preferred Cards.
 */
function getPreferredCards(preferences, paymentCards) {
    var preferredCardsMap = {};
    if (preferences.worldPayEnableCardSelection) {
        var cardsArray = preferences.worldPayPaymentMethodMaskIncludes;
        if (cardsArray && cardsArray.valueOf()) {
            preferredCardsMap = cardsArray.map(function (card) {
                return {
                    value: card.valueOf() || '',
                    displayValue: card.valueOf() || ''
                };
            });
        }
        if (paymentCards) {
            var activeCardsMap = paymentCards.map(function (card) {
                return {
                    value: card.value,
                    displayValue: card.displayValue
                };
            });
            var tempArray = [];
            if (preferredCardsMap && activeCardsMap) {
                tempArray = tempArray.concat(preferredCardsMap).concat(activeCardsMap);
                preferredCardsMap = tempArray;
            } else if (activeCardsMap) {
                preferredCardsMap = activeCardsMap;
            }
        }
    }
    return preferredCardsMap;
}

/**
 * Creates an array of objects containing applicable payment methods
 * @param {dw.util.ArrayList<dw.order.dw.order.PaymentMethod>} paymentMethods - An ArrayList of
 *      applicable payment methods that the user could use for the current basket.
 * @param {string} countryCode - the associated apm countryCode
 * @param {Object} preferences - the associated worldpay preferences
 * @returns {Array} of object that contain information about the applicable payment methods for the
 *      current cart
 */
function applicablePaymentMethods(paymentMethods, countryCode, preferences) {
    var applicablePMResult = require('*/cartridge/scripts/order/worldpayPayment').applicablePaymentMethods(paymentMethods, countryCode, preferences);
    var applicableAPMs = applicablePMResult.applicableAPMs;
    return collections.map(applicableAPMs, function (method) {
        return {
            ID: method.ID,
            name: method.name,
            apmImagePath: (method.image != null) ? method.image.absURL.toString() : null
        };
    });
}


/**
 * Creates an array of objects containing selected payment information
 * @param {dw.util.ArrayList<dw.order.PaymentInstrument>} selectedPaymentInstruments - ArrayList
 *      of payment instruments that the user is using to pay for the current basket
 * @param {string} countryCode - the associated apm countryCode
 * @param {List} applicablePayMethods - applicable payment methods
 * @returns {Array} Array of objects that contain information about the selected payment instruments
 */
function getSelectedPaymentInstruments(selectedPaymentInstruments, countryCode, applicablePayMethods) {
    var formatMoney = require('dw/util/StringUtils').formatMoney;
    return collections.map(selectedPaymentInstruments, function (paymentInstrument) {
        var matchPaymentInstrument = null;
        if (applicablePayMethods) {
            matchPaymentInstrument = array.find(applicablePayMethods, function (method) {
                if (method.ID === paymentInstrument.paymentMethod) {
                    return true;
                }
                return false;
            });
        }
        if (undefined === matchPaymentInstrument || !matchPaymentInstrument) {
            return {};
        }
        var results = {
            paymentMethod: paymentInstrument.paymentMethod,
            paymentMethodName: PaymentMgr.getPaymentMethod(paymentInstrument.paymentMethod) ? PaymentMgr.getPaymentMethod(paymentInstrument.paymentMethod).name : paymentInstrument.paymentMethod,
            amount: paymentInstrument.paymentTransaction.amount.value,
            amountFormatted: formatMoney(paymentInstrument.paymentTransaction.amount)
        };
        if (paymentInstrument.paymentMethod === WorldpayConstants.CREDITCARD) {
            results.lastFour = paymentInstrument.creditCardNumberLastDigits;
            results.owner = paymentInstrument.creditCardHolder;
            results.expirationYear = paymentInstrument.creditCardExpirationYear;
            results.type = paymentInstrument.creditCardType;
            results.maskedCreditCardNumber = paymentInstrument.maskedCreditCardNumber;
            results.expirationMonth = paymentInstrument.creditCardExpirationMonth;
            var truncatedCardNumber = (paymentInstrument.creditCardNumber).slice(0, 6);
            results.ccnum = truncatedCardNumber;
        } else if (paymentInstrument.paymentMethod === 'GIFT_CERTIFICATE') {
            results.giftCertificateCode = paymentInstrument.giftCertificateCode;
            results.maskedGiftCertificateCode = paymentInstrument.maskedGiftCertificateCode;
        }

        return results;
    });
}

/**
 * Payment class that represents payment information for the current basket
 * @param {dw.order.Basket} currentBasket - the target Basket object
 * @param {dw.customer.Customer} currentCustomer - the associated Customer object
 * @param {string} countryCode - the associated Site countryCode
 * @constructor
 */
function Payment(currentBasket, currentCustomer, countryCode) {
    var paymentCountryCode = currentBasket.billingAddress ? currentBasket.billingAddress.countryCode.value : countryCode;
    var paymentAmount = currentBasket.totalGrossPrice;
    var paymentMethods = PaymentMgr.getApplicablePaymentMethods(
        currentCustomer,
        paymentCountryCode,
        paymentAmount.value
    );
    var paymentCards = PaymentMgr.getPaymentMethod(PaymentInstrument.METHOD_CREDIT_CARD)
        .getApplicablePaymentCards(currentCustomer, paymentCountryCode, paymentAmount.value);
    var paymentInstruments = currentBasket.paymentInstruments;

    var worldPayPreferences = new WorldpayPreferences();
    var preferences = worldPayPreferences.worldPayPreferencesInit();


    this.applicablePaymentMethods =
        paymentMethods ? applicablePaymentMethods(paymentMethods, paymentCountryCode, preferences) : null;

    this.resources = RESOURCES;

    this.applicablePaymentCards =
        paymentCards ? applicablePaymentCards(paymentCards) : null;

    this.selectedPaymentInstruments = paymentInstruments ?
        getSelectedPaymentInstruments(paymentInstruments, paymentCountryCode, this.applicablePaymentMethods) : null;


    this.worldPayPreferredCards = getPreferredCards(preferences, this.applicablePaymentCards);

    this.apmlookupCountry = paymentCountryCode;

    this.worldpayEnableTokenization = preferences.worldPayEnableTokenization;
}

module.exports = Payment;
