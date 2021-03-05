/* eslint-disable require-jsdoc */
/* eslint-disable no-unused-vars */

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
                    checkout.generateSessions(function (err, sessions) {
                        if (err) {
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

