'use strict';

var base = require('base/checkout/billing');

/**
 * Events that are fired at start of any AJAX
 */
base.ajaxStartEvents = function () {
    $(document).ajaxStart(function (event) {
        if ($(event.currentTarget.activeElement).hasClass('submit-payment') || $(event.currentTarget.activeElement).hasClass('place-order') || $(event.currentTarget.activeElement).hasClass('submit-shipping')) {
            $.spinner().start();
        }
    });
};

/**
 * Events for handling CC disclaimer feature
 */
function disclaimerEvents() {
    if ($('.form-check-input.check').is(':checked') && $('.payment-information').data('payment-method-id') === 'CREDIT_CARD') {
        $('.dis_id').show();
        if ($('#isDisclaimerMandatory').attr('value') === 'false' && $('#showDisclaimer').attr('value') === 'true' && !$('[name="disclaimer"][value="yes"]').is(':checked')) {
            $('#chosetosave').show();
        }
    }


    $('.form-check-input.check').click(function () {
        if ($('.payment-information').data('payment-method-id') === 'CREDIT_CARD') {
            if ($(this).is(':checked')) {
                $('.dis_id').show();
                if ($('#isDisclaimerMandatory').attr('value') === 'false' && $('#showDisclaimer').attr('value') === 'true') {
                    $('#chosetosave').show();
                }
            } else {
                $('.dis_id').hide();
                $('#disclaimererror').hide();
                $('#chosetosave').hide();
            }
        }
    });

    $('#disclaimerModal').on('hidden.bs.modal', function () {
        if ($("input[name$='disclaimer']:checked").val() === 'no') {
            $('.form-check-input.check').prop('checked', false);
            $('.dis_id').hide();
            $('#disclaimererror').hide();
        }
        $('#chosetosave').hide();
        if ($("input[name$='disclaimer']:checked").val()) {
            $('#disclaimererror').hide();
        }
    });

    $('body').on('click', '.nav-item#CREDIT_CARD', function () {
        $('.tab-pane.credit-card-content-redirect input[name$="_creditCardFields_saveCard"]').prop('checked', false);
        $('.tab-pane.credit-card-content input[name$="_creditCardFields_saveCard"]').prop('checked', true);
        if ($('#isDisclaimerMandatory').attr('value') === undefined && $('#showDisclaimer').attr('value') === 'true' && $('.data-checkout-stage').data('customer-type') === 'registered') {
            $('#chosetosave').show();
        }
    });
}

/**
 * Event listener for 3DS DDC
 */
base.eventListener3DS = function () {
    window.addEventListener('message', function (event) {
        var data = JSON.parse(event.data);
        var dataSessionId = data.SessionId;
        var url = $('#authenticate3dsURL').val();
        $.ajax({
            url: url,
            data: { dataSessionId: dataSessionId },
            type: 'POST',
            success: function (response) {
                if (response.outcome === 'challenged') {
                    window.location.href = response.continueURL;
                } else if (response.redirectURL) {
                    window.location.href = response.redirectURL;
                }
            }
        });
    }, false);
};

/**
 * WebCheckout SDk events
 */
function sdkTabevents() {
    var paymentType = $('.payment-information').data('payment-method-id').trim();
    var $ccSecurityType = $('.payment-information').data('cc-security-type');
    if (paymentType === 'CREDIT_CARD' && $ccSecurityType === 'WEB_SDK') {
        if ($('.saved-payment-instrument').length && $('#novtokenerror').is(':hidden') && $('#wpservererror').is(':hidden')) {
            if ($('#updateLimitCrossed').is(':visible')) {
                $('.cardSDK').show();
                $('#submitPaymentButton').prop('disabled', true);
            } else {
                $('.cardSDK').hide();
                $('#submitPaymentButton').prop('disabled', false);
            }
            $('.worldpaySaveCreditFields').hide();
        } else {
            $('.cardSDK').show();
            $('.worldpaySaveCreditFields').hide();
            $('#submitPaymentButton').prop('disabled', true);
        }
    } else {
        $('#submitPaymentButton').prop('disabled', false);
        $('.worldpaySaveCreditFields').show();
    }
}

/**
 * Events fired at the complete of any AJAX
 */
base.ajaxCompleteEvents = function () {
    $(document).ajaxComplete(function () {
        $.spinner().stop();
        disclaimerEvents();
        if ($('#isvtokenavailable').attr('value') !== 'true') {
            sdkTabevents();
        }
        var str = $('.payment-details').find('div span').text();
        if (str.length > 0 && str.trim().indexOf('/') === (str.trim().length - 1)) {
            str = str.replace('/', '');
        }
        $('.payment-details').find('div span').text(str);
    });
};

/**
 * CVV validation
 */
base.securityCodeValidation = function () {
    $('#securityCode').on('keypress', function (ev) {
        var evt = (ev) || window.event;
        var charCode = (evt.which) ? evt.which : evt.keyCode;
        if (charCode > 31 && (charCode < 48 || charCode > 57)) {
            return false;
        }
        return true;
    });
};

/**
 * Click events for Submit button
 */
base.submitBtnClickEvents = function () {
    var $ccSecurityType = $('.payment-information').data('cc-security-type');
    // eslint-disable-next-line consistent-return
    $('.submit-payment').on('click', function () {
        if ($('.payment-information').data('payment-method-id')) {
            $('input[name$="paymentMethod"]').val($('.payment-information').data('payment-method-id'));
        }
        if ($('.payment-information').data('payment-method-id') === 'GooglePay') {
            if ($('#gpaytoken').attr('value') === '') {
                $('#gpayerror').show();
                return false;
            }
        }
        if ($('#isDisclaimerMandatory').attr('value') === 'true' && $('#showDisclaimer').attr('value') === 'true' && $('.form-check-input.check').is(':checked')) {
            if ($('div.user-payment-instruments.checkout-hidden').length !== 0 && $('.payment-information').data('payment-method-id') === 'CREDIT_CARD') {
                if ($('#clickeventdis').attr('value') === '' && ($("input[name$='disclaimer']:checked").val() === 'no')) {
                    $('#disclaimererror').show();
                    return false;
                }
            }
        }


        if ($('#isDisclaimerMandatory').attr('value') === undefined && $('.form-check-input.check').is(':checked')) {
            if ($('.payment-information').data('payment-method-id') === 'CREDIT_CARD') {
                $('#chosetosave').hide();
            }
        }


        if ($('.data-checkout-stage').data('customer-type') === 'registered') {
            // if payment method is credit card
            $('.payment-information input:hidden[name$=storedPaymentUUID]').remove();
        }

        // set the credit card holder name on the form from web sdk form
        if ($('input[name$="paymentMethod"]').val() === 'CREDIT_CARD' && $ccSecurityType === 'WEB_SDK') {
            let creditCardHolder = $('#card-form #websdkname').val();
            $('#cardOwner').val(creditCardHolder);
        }

        if ($('input[name$="paymentMethod"]').val() === 'CREDIT_CARD' && undefined !== $('.cardNumber').data('cleave')) {
            var creditCardTypes = {
                visa: 'Visa',
                mastercard: 'MasterCard',
                amex: 'Amex',
                discover: 'Discover',
                uatp: 'Airplus',
                diners: 'DinersClub',
                dankort: 'Dankort',
                instapayment: 'Instapayment',
                jcb: 'JCB',
                maestro: 'Maestro',
                laser: 'Laser',
                general: 'General',
                unionPay: 'UnionPay',
                mir: 'Mir',
                generalStrict: 'GeneralStrict',
                unknown: 'Unknown'
            };

            var cardType = creditCardTypes[Object.keys(creditCardTypes).indexOf($('.cardNumber').data('cleave').properties.creditCardType) > -1
                ?
                $('.cardNumber').data('cleave').properties.creditCardType
                :
                'unknown'];
            $('#cardType').val(cardType);
            $('.card-number-wrapper').attr('data-type', cardType);
        }
        if ($('.saved-payment-security-code').length > 0) {
            var regex = /^(\s*|[0-9]{3})$/;
            var regexAmex = /^(\s*|[0-9]{4})$/;
            $('.saved-payment-security-code').each(function () {
                var cardTypeText = $('.saved-payment-security-code').parents('.saved-payment-instrument').find('.saved-credit-card-type').text();
                if (cardTypeText && cardTypeText.indexOf('Amex') > -1 && (regexAmex.test($(this).val()) === false)) {
                    $(this).siblings('.invalid-feedback').show();
                } else if (cardTypeText && cardTypeText.indexOf('Amex') < 0 && (regex.test($(this).val()) === false)) {
                    $(this).siblings('.invalid-feedback').show();
                }
            });
        }
    });
};

/**
 * Card number field events
 */
base.cardNumberFieldEvent = function () {
    $('body').on('focusout', '#cardNumber', function () {
        var cType = $('.card-number-wrapper')[0].dataset.type;
        if (cType === 'visa' || cType === 'mastercard' || cType === 'discover' || cType === 'maestro' || cType === 'laser' || cType === 'uatp' || cType === 'diners' || cType === 'jcb') {
            $('#securityCode').attr('maxlength', 3);
        } else {
            $('#securityCode').attr('maxlength', 4);
        }
        return true;
    });
};

/**
 * Handle click for saved payment instrument section
 */
base.savedPaymentInstrumentEvents = function () {
    $(document).on('click', '.saved-payment-instrumentwesdk', function (e) {
        e.preventDefault();
        $('.saved-payment-security-code').val('');
        $('.saved-payment-instrumentwesdk').removeClass('selected-payment');
        $(this).addClass('selected-payment');
        $('.saved-payment-instrumentwesdk .card-image').removeClass('checkout-hidden');
        $('.saved-payment-instrumentwesdk .security-code-input').addClass('checkout-hidden');
        $('.saved-payment-instrumentwesdk.selected-payment' +
            ' .card-image').addClass('checkout-hidden');
        $('.saved-payment-instrumentwesdk.selected-payment ' +
            '.security-code-input').removeClass('checkout-hidden');
    });
};

/**
 * Handle navigation click events
 */
base.navClickEvent = function () {
    $(document).on('click', '.payment-options .nav-item', function (e) {
        var paymentType = $(e.currentTarget).attr('data-method-id');
        var $ccSecurityType = $('.payment-information').data('cc-security-type');
        $('.payment-information').attr('data-payment-method-id', paymentType);
        if (paymentType === 'CREDIT_CARD' && $ccSecurityType === 'WEB_SDK') {
            $('#submitPaymentButton').prop('disabled', true);
            $('.cardSDK').show();
            $('.worldpaySaveCreditFields').hide();
            $('.editbutton').hide();
            $('#vtokensuccess').hide();
            $('#webcsdk-savecard').hide();
            $('#novtokenerror').hide();
            $('#wpservererror').hide();
            $('#updateLimitCrossed').hide();
            if ($('.saved-payment-instrument').length) {
                $('.cardSDK').hide();
                $('#submitPaymentButton').prop('disabled', false);
                $('.cancel-new-payment').addClass('checkout-hidden');
                $('.user-payment-instruments').removeClass('checkout-hidden');
            }
        } else {
            $('#submitPaymentButton').prop('disabled', false);
            $('.worldpaySaveCreditFields').show();
        }
    });
};

/**
 * clears the credit card form
 */
function clearCreditCardForm() {
    $('input[name$="_cardNumber"]').data('cleave').setRawValue('');
    $('select[name$="_expirationMonth"]').val('');
    $('select[name$="_expirationYear"]').val('');
    $('input[name$="_securityCode"]').val('');
}

base.addNewPaymentInstrument = function () {
    var $ccSecurityType = $('.payment-information').data('cc-security-type');
    $('.btn.add-payment').on('click', function (e) {
        e.preventDefault();
        $('.payment-information').data('is-new-payment', true);
        clearCreditCardForm();
        $('.credit-card-form').removeClass('checkout-hidden');
        $('.user-payment-instruments').addClass('checkout-hidden');
        if ($ccSecurityType === 'WEB_SDK') {
            $('#submitPaymentButton').prop('disabled', true);
            $('.cardSDK').show();
            $('#vtokensuccess').hide();
            $('.editbutton').hide();
            $('.worldpaySaveCreditFields').hide();
            $('.cancel-new-payment').removeClass('checkout-hidden');
            $('button.clear_form_worldpay').trigger('click');
        }
    });
};

base.cancelNewPayment = function () {
    var $ccSecurityType = $('.payment-information').data('cc-security-type');
    $('.cancel-new-payment').on('click', function (e) {
        e.preventDefault();
        $('.payment-information').data('is-new-payment', false);
        clearCreditCardForm();
        $('.user-payment-instruments').removeClass('checkout-hidden');
        $('.credit-card-form').addClass('checkout-hidden');
        if ($ccSecurityType === 'WEB_SDK') {
            $('#submitPaymentButton').prop('disabled', false);
            $('#updateLimitCrossed').hide();
        }
    });
};

base.changePayment = function () {
    $('.change-payment a.editbutton').on('click', function () {
        $('.cardSDK').show();
        $('.editbutton').hide();
        $('#submitPaymentButton').prop('disabled', true);
        $('#vtokensuccess').hide();
        $('#webcsdk-savecard').hide();
        $('.stored-paymentswebsdk').hide();
        $('.worldpaySaveCreditFields').hide();
        $('button.clear_form_worldpay').trigger('click');
    });
};

/**
 * Document Ready events
 */
base.documentReadyEvents = function () {
    $(document).ready(function () {
        disclaimerEvents();
        sdkTabevents();
    });
};


module.exports = base;

