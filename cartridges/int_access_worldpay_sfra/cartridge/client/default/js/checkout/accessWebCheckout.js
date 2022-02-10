/* eslint-disable require-jsdoc */
/* eslint-disable no-unused-vars */
/* eslint-disable no-unused-expressions */

'use strict';

let spinner = require('base/components/spinner');

$('#websdkname').on('input', function (e) {
    if ($('#websdkname').val()) {
        $('#websdkname').css('border-color', 'green');
        $('#websdkname').css('color', 'green');
    } else {
        $('#websdkname').css('border-color', 'red');
        $('#websdkname').css('color', 'red');
    }
});

function processPayment(sessions) {
    var url = $('#payNowUrl').val();
    var wsdkname = $('#websdkname').val();
    var sessCard = sessions.card;
    $.ajax({
        url: url,
        data: { sessCard: sessCard,
            wsdkname: wsdkname
        },
        type: 'POST',
        success: function (response) {
            $.spinner().stop();
            if (!response.error) {
                $('#isvtokenavailable').val('true');
                $('.cardSDK').hide();
                $('.editbutton').show();
                $('#vtokensuccess').show();
                $('#webcsdk-savecard').show();
                $('#updateLimitCrossed').hide();
                $('#submitPaymentButton').prop('disabled', false);
                $('#novtokenerror').hide();
                $('#wpservererror').hide();
                $('.worldpaySaveCreditFields').show();
                $('.form-check.save-credit-card').show();
                $('.form-check-input.check').prop('disabled', false);
                $('.form-check-input.check').prop('checked', true);
                $('#cardUpdated').hide();
                $('#disclaimer').show();
                $('#cardExists').hide();
                $('input:radio[name="disclaimer"][value="no"]').prop('checked', true);
                if (response.cardUpdated) {
                    $('#cardUpdated').show();
                    $('.form-check-input.check').prop('disabled', true);
                    $('input:radio[name="disclaimer"][value="yes"]').prop('checked', true);
                    $('#disclaimer').hide();
                    $('#cardExists').hide();
                    $('#chosetosave').hide();
                }
                if (response.cardExists) {
                    $('.form-check-input.check').prop('checked', false);
                    $('.form-check.save-credit-card').hide();
                    $('#disclaimer').hide();
                    $('#chosetosave').hide();
                    $('#cardExists').show();
                }
            } else if (response.error) {
                if (response.servererror) {
                    $('#novtokenerror').hide();
                    $('#updateLimitCrossed').hide();
                    $('#wpservererror').show();
                    $('.worldpaySaveCreditFields').show();
                    $('.form-check-input.check').prop('checked', false);
                    $('.form-check.save-credit-card').hide();
                    $('#cardUpdated').hide();
                    $('#cardExists').hide();
                    $('#disclaimer').hide();
                } else if (response.verified === 'not verified') {
                    $('#wpservererror').hide();
                    $('#updateLimitCrossed').hide();
                    $('#novtokenerror').show();
                    $('#cardUpdated').hide();
                    $('.form-check-input.check').prop('checked', false);
                    $('.form-check.save-credit-card').hide();
                    $('#cardExists').hide();
                    $('#disclaimer').hide();
                } else if (response.updateLimitCrossed) {
                    $('#wpservererror').hide();
                    $('#novtokenerror').hide();
                    $('#updateLimitCrossed').show();
                    $('#cardUpdated').hide();
                    $('.form-check-input.check').prop('checked', false);
                    $('.form-check.save-credit-card').hide();
                    $('#cardExists').hide();
                    $('#disclaimer').hide();
                }
            }
        },
        error: function () {
            $.spinner().stop();
            // display some errors in case needed.
        }
    });
}

(function () {
    var form = '#card-form';
    var $form = document.getElementById('card-form');
    var $clear = document.getElementById('clear_form_worldpay');
    var webCSDKIdentity = document.getElementById('webCSDKIdentity') ? document.getElementById('webCSDKIdentity').value : '';
    var id = webCSDKIdentity;
    var styles = {
        input: {
            'font-size': '14px',
            'font-family': 'Arial'
        },
        'input.is-valid': {
            color: 'green'
        },
        'input.is-invalid': {
            color: 'red'
        }
    };
    var fields = {
        pan: {
            selector: '#card-pan',
            placeholder: 'Card number'
        },
        expiry: {
            selector: '#card-expiry',
            placeholder: 'MM/YY'
        },
        cvv: {
            selector: '#card-cvv',
            placeholder: 'CVV'
        }
    };
    if (Worldpay) {
        Worldpay.checkout.init(
            {
                id: id,
                styles: styles,
                form: form,
                fields: fields
            },
            function (err, checkout) {
                if (err) {
               // handle init error
                    return;
                }
                $form.addEventListener('submit', function (event) {
                    $.spinner().start();
                    event.preventDefault();
                    checkout.generateSessions(function (sessionErr, sessions) {
                        if (sessionErr) {
                            // handle session state generation error
                            $.spinner().stop();
                            return;
                        }
                        // send sessions to the server
                        processPayment(sessions);
                    });
                });
                $clear.addEventListener('click', function (event) {
                    event.preventDefault();
                    checkout.clearForm(function () {
                    });
                });
            }
        );
    }
}());

/**
 * Delete the CVV href in session
 *
 */

function deleteSessionCVVHref() {
    var url = $('#clearCVVSession').val();
    $.ajax({
        url: url,
        type: 'GET',
        success: function (response) {
            if (!response.success) {
                return;
            }
            return;
        },
        error: function () {
            return;
        }
    });
}

function cvvCheckoutInit(i) {
    var checkoutID = document.getElementById('webCSDKIdentity') ? document.getElementById('webCSDKIdentity').value : '';
    var ccvSubmitButton = '#cvvSubmit_' + i + '';
    var ccvClearButton = '#clear_' + i + '';
    var cvvField = '#cvv-field_' + i + '';
    var cvvForm = '#cvv-form_' + i + '';
    var cvvConfirmed = '#cvvConfirmed_' + i + '';
    var cvvErrorText = '#cvvError_' + i + '';

    var styles = {
        input: {
            'font-size': '14px',
            'font-family': 'Arial'
        },
        'input.is-valid': {
            color: 'green'
        },
        'input.is-invalid': {
            color: 'red'
        }
    };

    var fields = {
        cvvOnly: {
            selector: cvvField,
            placeholder: 'CVV'
        }
    };
    if (Worldpay) {
        Worldpay.checkout.init({
            id: checkoutID,
            form: cvvForm,
            fields: fields,
            styles: styles
        }, function (error, checkout) {
            if (error) {
                // eslint-disable-next-line
                alert('Error: ' + error);
                return;
            }

            $(ccvSubmitButton).unbind('click.mynamespace');

            $(ccvSubmitButton).bind('click.mynamespace', function (event) {
                event.preventDefault();
                event.stopPropagation();
                $.spinner().start();
                var eventTriggered = true;
                checkout.generateSessionState(function (cvvError, sessionState) {
                    $('.cvv-confirm').hide();
                    $('.cvv-error').hide();
                    if (eventTriggered) {
                        if (cvvError) {
                            $.spinner().stop();
                            deleteSessionCVVHref();
                            $(cvvErrorText).show();
                            return;
                        }
                        var url = $('#setCVVSession').val();
                        $.ajax({
                            url: url,
                            data: { sessCVV: sessionState },
                            type: 'POST',
                            success: function (response) {
                                if (!response.success) {
                                    deleteSessionCVVHref();
                                    return;
                                }
                                $.spinner().stop();
                                $(cvvConfirmed).show();
                            },
                            error: function () {
                                deleteSessionCVVHref();
                                $.spinner().stop();
                                return;
                            }
                        });
                        eventTriggered = false;
                    }
                });
                checkout.clearForm(function () {
                    // to clear the sensitive CVV value post form submission
                });
            });

            $(ccvClearButton).on('click', function (event) {
                event.preventDefault();
                event.stopPropagation();
                var eventTriggered = true;
                $('.cvv-confirm').hide();
                $('.cvv-error').hide();
                checkout.clearForm(function () {
                    $.spinner().start();
                    if (eventTriggered) {
                        deleteSessionCVVHref();
                        eventTriggered = false;
                    }
                    $.spinner().stop();
                });
            });

            $('#cvv-form_' + i + '').off('wp:field:change').on('wp:field:change', function (event) {
                if (event.detail['is-valid'] && event.detail.field.$element) {
                    event.detail.field.$element.classList.add('valid-icon');
                } else {
                    event.detail.field.$element.classList.remove('valid-icon');
                }
            });

            $('#cvv-form_' + i + '').off('wp:form:change').on('wp:form:change', function (event) {
            });
        });
    }
}

$(document).ready(function () {
    if ($('.saved-payment-instrument').length && $('#webCvvSDK').val() === 'true') {
        deleteSessionCVVHref();
        var index = $('.stored-payments .saved-payment-instrument').index($('.selected-payment'));
        cvvCheckoutInit(index);
    }
});

$(document).on('click', '.saved-payment-instrument', function (e) {
    $(document).off('click', '.cvvSubmit');
    var index = $('.stored-payments .saved-payment-instrument').index($('.selected-payment'));
    if ($(e.target).closest('.saved-payment-instrument').length && $('#webCvvSDK').val() === 'true') {
        deleteSessionCVVHref();
        $('#access-worldpay-cvv-only').length && $('#access-worldpay-cvv-only')[0].remove();
        $('body').undelegate('.cvvSubmit', 'click');
        $('.cvv-confirm').hide();
        $('.cvv-error').hide();
        cvvCheckoutInit(index);
    }
});

function clearCVVForm() {
    if ($('.saved-payment-instrument').length && $('#webCvvSDK').val() === 'true') {
        $('#access-worldpay-cvv-only').length && $('#access-worldpay-cvv-only')[0].remove();
        deleteSessionCVVHref();
        var index = $('.stored-payments .saved-payment-instrument').index($('.selected-payment'));
        $('.cvv-confirm').hide();
        $('.cvv-error').hide();
        cvvCheckoutInit(index);
    }
}

$('body').on('click', '.payment-summary .edit-button', function () {
    clearCVVForm();
});

$('body').on('click', '.shipping-summary .edit-button', function () {
    clearCVVForm();
});

$('body').on('click', '.btn.add-payment', function () {
    clearCVVForm();
});
