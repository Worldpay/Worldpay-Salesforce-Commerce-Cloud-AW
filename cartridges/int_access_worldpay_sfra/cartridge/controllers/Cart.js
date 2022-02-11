'use strict';

var page = module.superModule;
var server = require('server');
server.extend(page);
var Resource = require('dw/web/Resource');
var URLUtils = require('dw/web/URLUtils');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');

/** Cart-Show : The Cart-Show endpoint renders the cart page with the current basket
 * @name Base/Cart-Show
 * @function
 * @memberof Cart
 * @param {category} - sensitive
 * @param {renders} - isml
 * @param {serverfunction} - get
 */
server.prepend('Show',
    server.middleware.https,
    consentTracking.consent,
    csrfProtection.generateToken,
    function (req, res, next) {
        var errorMessage = null;
        if (session.privacy.narrativeError) {
            var Logger = require('dw/system/Logger');
            delete session.privacy.narrativeError;
            errorMessage = Resource.msg('worldpay.error.codenarrativeERROR', 'worldpayError', null);
            if (errorMessage) {
                Logger.getLogger('worldpay').error('Redirecting from Cart-Show to Cart-Show : error = narrativeError : errorMessage =' + errorMessage);
                res.redirect(URLUtils.https('Cart-Show', 'placeerror', 'narrativeError').toString());
            } else {
                Logger.getLogger('worldpay').error('Redirecting from applePayAuth.js to Cart-Show line32');
                res.redirect(URLUtils.url('Cart-Show'));
            }
            return next();
        }
        if (!empty(session.privacy.currentOrderNo)) {
            var Transaction = require('dw/system/Transaction');
            var OrderMgr = require('dw/order/OrderMgr');
            Transaction.wrap(function () {
                OrderMgr.failOrder(OrderMgr.getOrder(session.privacy.currentOrderNo), true);
            });
            delete session.privacy.currentOrderNo;
            return next();
        }
        return next();
    });
module.exports = server.exports();
