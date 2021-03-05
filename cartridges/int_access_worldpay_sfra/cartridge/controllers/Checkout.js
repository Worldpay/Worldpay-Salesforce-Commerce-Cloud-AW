'use strict';

var page = module.superModule;
var server = require('server');
server.extend(page);
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var URLUtils = require('dw/web/URLUtils');
var Transaction = require('dw/system/Transaction');

/**
 * Main entry point for Checkout
 */
/**
 * Checkout-Login : The Checkout-Login endpoint will render a checkout landing page that allows the shopper to select checkout as guest or as returning shopper
 * @name Base/Checkout-Login
 * @function
 * @memberof Checkout
 * @param {middleware} - server.middleware.https
 * @param {middleware} - consentTracking.consent
 * @param {middleware} - csrfProtection.generateToken
 * @param {category} - sensitive
 * @param {renders} - isml
 * @param {serverfunction} - get
 */
server.prepend('Begin', server.middleware.https, consentTracking.consent, csrfProtection.generateToken, function (req, res, next) {
    var errorMessage = null;
    if (undefined !== req.querystring.placeerror && req.querystring.placeerror) {
        errorMessage = req.querystring.placeerror;
    }

    if (session.privacy.currentOrderNo) {
        var orderMgr = require('dw/order/OrderMgr');
        Transaction.wrap(function () {
            orderMgr.failOrder(orderMgr.getOrder(session.privacy.currentOrderNo), true);
        });

        if (errorMessage) {
            res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'placeOrder', 'placeerror', errorMessage));
        } else {
            res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'placeOrder'));
        }

        delete session.privacy.currentOrderNo;
        return next();
    }
    return next();
});

module.exports = server.exports();
