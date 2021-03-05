'use strict';

var Resource = require('dw/web/Resource');
var CreateRequestHelper = require('*/cartridge/scripts/common/createRequestHelper');
var WorldpayConstants = require('*/cartridge/scripts/common/worldpayConstants');


/* This payment array helps to achive to construct the
*  instructions Object without modifying the existing functions
*/
var paymentsArray = [];

/**
 * Returns Gpay details
 * @param {dw.order.PaymentInstrument} paymentInstrument - Order payment instrument
 * @param {Object} options - object for passing additional parameters
 * @returns {Object} Gpay details object
 */
function getGpayDetails(paymentInstrument, options) {
    var ccObj = {
        type: options.type,
        walletToken: paymentInstrument.custom.gpayToken
    };
    return ccObj;
}

/**
 * Returns narrative for the order request
 * @param {dw.order.Order} order - Current order object
 * @returns {Object} narrative object
 */
function getNarrative(order) {
    var tradingName = Resource.msg('order.channel.storefront', 'worldpay', null);
    if (!(order.createdBy.equals(WorldpayConstants.CUSTOMERORDER)) && session.isUserAuthenticated()) {
        tradingName = Resource.msg('order.channel.moto', 'worldpay', null);
    }

    return {
        line1: tradingName,
        line2: order.orderNo.toString()
    };
}

/**
 * Returns the total amount object
 * @param {dw.order.Order} order - order object
 * @param {Object} preferences - preferences object
 * @returns {Object} Total amount object
 */
function getValue(order, preferences) {
    var Utils = require('*/cartridge/scripts/common/utils');
    var totalprice = Utils.calculateNonGiftCertificateAmount(order);
    var currency = totalprice.getCurrencyCode().toString();
    var amount = totalprice.getValue();
	// multiplying amount with currentExponent (2) power of 10 since downstream systems have currency exponent of 2
    amount = parseInt((amount.toFixed(2) * (Math.pow(10, preferences.currencyExponent))).toFixed(0), 10);
    return {
        currency: currency,
        amount: amount
    };
}

/**
 * Returns Gpay details
 * @param {dw.order.PaymentInstrument} paymentInstrument - Order payment instrument
 * @param {Object} options - object for passing additional parameters
 * @returns {Object} Gpay details object
 */
function getWCDSKPaymentDetails(paymentInstrument, options) {
    var ccObj = {
        type: options.type,
        href: paymentInstrument.custom.awpCCTokenData
    };
    return ccObj;
}

/**
 * Returns instruction object
 * @param {dw.order.Order} order - current order object
 * @param {Object} preferences - worldpay site preferences
 * @param {dw.order.PaymentInstrument} paymentInstrument - order payment instrument
 * @param {Object} options - Object for passing additional parameters
 * @returns {Object} instruction object
 */
function getInstructionForWCSDK(order, preferences, paymentInstrument, options) {
    var instruction = {};
    if (!Object.prototype.hasOwnProperty.call(options, 'excludeNarrative')) {
        instruction.narrative = getNarrative(order);
    }
    instruction.value = getValue(order, preferences);
    instruction.paymentInstrument = getWCDSKPaymentDetails(paymentInstrument, options);
    if (instruction.paymentInstrument.type !== 'card/tokenized') {
        instruction.paymentInstrument.billingAddress = CreateRequestHelper.getBillingAddress(order);
    }
    return instruction;
}


/**
 * Returns instruction object
 * @param {dw.order.Order} order - current order object
 * @param {Object} preferences - worldpay site preferences
 * @param {dw.order.PaymentInstrument} paymentInstrument - order payment instrument
 * @param {Object} options - Object for passing additional parameters
 * @returns {Object} instruction object
 */
function getInstruction(order, preferences, paymentInstrument, options) {
    var paymentMethod = paymentInstrument.paymentMethod;
    var instruction = {};
    if (!Object.prototype.hasOwnProperty.call(options, 'excludeNarrative')) {
        instruction.narrative = getNarrative(order);
    }
    instruction.value = getValue(order, preferences);
    paymentsArray.forEach(function (paymentType) {
        if (paymentType.name === paymentMethod) {
            instruction = paymentType.prepareInstructions(paymentInstrument, options, instruction, order);
        }
    });
    return instruction;
}

/**
 * CreditCardInstructions - Constructs the Instruction for Credit Card
 * @returns {Object} - Instructions Object
 */
function CreditCardInstructions() {
    return {
        name: 'CREDIT_CARD', // Match the ID of paymentMethod
        prepareInstructions: function (paymentInstrument, options, instructionDetails, order) {
            var instruction = instructionDetails;
            instruction.paymentInstrument = CreateRequestHelper.getCCDetails(paymentInstrument, options);
            if (instruction.paymentInstrument && instruction.paymentInstrument.type !== 'card/tokenized') {
                instruction.paymentInstrument.billingAddress = CreateRequestHelper.getBillingAddress(order);
            }
            return instruction;
        }
    };
}

/**
 * GPAYInstructions - Constructs the Instruction for GooglePay
 * @returns {Object} - Instructions Object
 */
function GPAYInstructions() {
    return {
        name: 'GooglePay',
        prepareInstructions: function (paymentInstrument, options, instructionDetails) {
            var instruction = instructionDetails;
            instruction.paymentInstrument = getGpayDetails(paymentInstrument, options);
            return instruction;
        }
    };
}

// Update this array if instructions object is needed differently for a new payment
paymentsArray.push(
    new CreditCardInstructions(),
    new GPAYInstructions()
);


module.exports = {
    getInstruction: getInstruction,
    getGpayDetails: getGpayDetails,
    getValue: getValue,
    getInstructionForWCSDK: getInstructionForWCSDK
};
