'use strict';

var server = require('server');
var userLoggedIn = require('*/cartridge/scripts/middleware/userLoggedIn');
server.extend(module.superModule);

/**
 * This controller fetches the latest order status from OMS
 */
server.get('GetOrderStatus', server.middleware.https, userLoggedIn.validateLoggedIn, function (req, res, next) {
    var OrderMgr = require('dw/order/OrderMgr');
    var HookMgr = require('dw/system/HookMgr');
    var URLUtils = require('dw/web/URLUtils');
    var orderNumber = req.querystring.orderID;
    var order = OrderMgr.getOrder(orderNumber);
    var omsOrdersResponse;
    var orderCustomerNo = req.currentCustomer.profile.customerNo;
    var currentCustomerNo = (order.customer.profile) ? order.customer.profile.customerNo : null;

    if (order && orderCustomerNo === currentCustomerNo) {
        // Calling the hook which abstracts the OMS call
        omsOrdersResponse = HookMgr.callHook('app.order.getStatusFromOMS', 'checkStatusInOMS', orderNumber);
        if (omsOrdersResponse && Object.prototype.hasOwnProperty.call(omsOrdersResponse, 'commerceOrderNumber')) {
            res.json({
                error: false,
                orderResponse: omsOrdersResponse
            });
        } else if (omsOrdersResponse && Object.prototype.hasOwnProperty.call(omsOrdersResponse, 'b2cOrderStatus')) {
            res.json({
                error: false,
                omsOrdersResponse: omsOrdersResponse
            });
        } else {
            res.json({
                error: true
            });
        }
    } else {
        res.redirect(URLUtils.url('Account-Show'));
    }
    next();
});

module.exports = server.exports();
