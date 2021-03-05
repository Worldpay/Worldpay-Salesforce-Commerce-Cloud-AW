'use strict';

var base = require('base/paymentInstruments/paymentInstruments');
var formValidation = require('base/components/formValidation');
var cleave = require('../components/cleave');

base.submitPayment = function () {
    $('form.payment-form').submit(function (e) {
        var $form = $(this);
        e.preventDefault();
        var url = $form.attr('action');
        $form.spinner().start();
        $('form.payment-form').trigger('payment:submit', e);

        var formData = cleave.serializeData($form);

        $.ajax({
            url: url,
            type: 'post',
            dataType: 'json',
            data: formData,
            success: function (data) {
                $form.spinner().stop();
                if (data.tokenConflict) {
                    $('#tokenConflict').show();
                    $('#novtokenerror').hide();
                    $('#wpservererror').hide();
                    $('#updateLimitCrossed').hide();
                }
                if (data.servererror) {
                    $('#wpservererror').show();
                    $('#novtokenerror').hide();
                    $('#tokenConflict').hide();
                    $('#updateLimitCrossed').hide();
                }
                if (data.updateLimitCrossed) {
                    $('#updateLimitCrossed').show();
                    $('#wpservererror').hide();
                    $('#novtokenerror').hide();
                    $('#tokenConflict').hide();
                }
                if (data.verfied === false) {
                    $('#novtokenerror').show();
                    $('#tokenConflict').hide();
                    $('#wpservererror').hide();
                    $('#updateLimitCrossed').hide();
                }

                if (!data.success) {
                    formValidation($form, data);
                } else {
                    location.href = data.redirectUrl;
                }
            },
            error: function (err) {
                if (err.responseJSON.redirectUrl) {
                    window.location.href = err.responseJSON.redirectUrl;
                }
                $form.spinner().stop();
            }
        });
        return false;
    });
};

module.exports = base;
