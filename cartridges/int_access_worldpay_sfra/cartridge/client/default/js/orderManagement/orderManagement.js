'use strict';

module.exports = {
    checkOrderStatus: function () {
        $('body').on('click', '.order-status-action', function (e) {
            e.preventDefault();
            var $this = $(this).next('.order-status-result');
            $this.parents('.card').spinner().start();
            $('.order-status-result').text('');
            var url = $(this).data('target');
            var errorMessage = $(this).data('error-message');
            $.ajax({
                url: url,
                method: 'GET',
                success: function (xhr) {
                    // reporting urls hit on the server
                    if (xhr && !xhr.error && xhr.orderResponse && Object.hasOwnProperty.call(xhr.orderResponse, 'omsFulfllmentOrderStatus')) {
                        $this.text(xhr.orderResponse.omsFulfllmentOrderStatus).addClass('bg-success text-white');
                        if ($this.hasClass('text-danger')) {
                            $this.removeClass('text-danger');
                        }
                        if (!($this.is('.mt-2, .col-6, .col-md-5'))) {
                            $this.addClass('mt-2 col-6 col-md-5');
                        }
                    } else if (xhr && !xhr.error && xhr.omsOrdersResponse && Object.hasOwnProperty.call(xhr.omsOrdersResponse, 'b2cOrderStatus')) {
                        if ($this.hasClass('text-danger')) {
                            $this.removeClass('text-danger');
                        }
                        if (!($this.is('.mt-2, .col-6, .col-md-5'))) {
                            $this.addClass('mt-2 col-6 col-md-5');
                        }
                        $this.text(xhr.omsOrdersResponse.b2cOrderStatus).addClass('bg-success text-white');
                    } else {
                        $this.removeClass().text(errorMessage).addClass('order-status-result text-danger');
                    }
                    $.spinner().stop();
                },
                error: function () {
                    // no reporting urls hit on the server
                    $this.text(errorMessage).addClass('text-danger');
                    $.spinner().stop();
                }
            });
        });
    }
};

