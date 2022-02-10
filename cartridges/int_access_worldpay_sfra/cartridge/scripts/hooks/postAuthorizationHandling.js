'use strict';

var URLUtils = require('dw/web/URLUtils');
var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
var server = require('server');
var Logger = require('dw/system/Logger');

/**
 *
 * @param {Object} handlePaymentResult - Authorization Result
 * @param {Order} order - Order
 * @param {Object} options - Options Object
 * @returns {Object} - object
 */
function postAuthorization(handlePaymentResult, order) {
    let billingForm = server.forms.getForm('billing');
    // local variables are created for the below session attributes to keep them alive during 3DS challenge page.
    var clearToken = session.privacy.clearToken;
    var cvvSessionHref = session.privacy.cvvSessionHref;
    if (handlePaymentResult.error) {
        if (!empty(session.privacy.currentOrderNo)) {
            delete session.privacy.currentOrderNo;
        }
        return {
            error: true,
            form: billingForm,
            fieldErrors: handlePaymentResult.fieldErrors,
            serverErrors: handlePaymentResult.serverErrors,
            errorMessage: handlePaymentResult.serverErrors ? handlePaymentResult.serverErrors : handlePaymentResult.errorMessage
        };
    } else if (handlePaymentResult.is3D) {
        session.privacy.JWT = handlePaymentResult.JWT;
        session.privacy.bin = handlePaymentResult.bin;
        session.privacy.ddcURL = handlePaymentResult.ddcURL;
        session.privacy.ThreeDsOrderNo = order.orderNo;
        return {
            error: false,
            is3D: true
        };
    } else if (handlePaymentResult.isChallenged) {
        session.privacy.challengeJWT = handlePaymentResult.jwt;
        session.privacy.challengeURL = handlePaymentResult.url;
        session.privacy.ThreeDsOrderNo = order.orderNo;
        return {
            continueUrl: URLUtils.https('Worldpay-ShowChallenge').toString()
        };
    } else if (handlePaymentResult.authorized) {
        // Places the order
        var placeOrderResult = COHelpers.placeOrder(order);
        if (placeOrderResult.error) {
            return {
                error: true,
                form: billingForm,
                fieldErrors: placeOrderResult.fieldErrors,
                serverErrors: placeOrderResult.serverErrors,
                errorMessage: placeOrderResult.serverErrors
            };
        }
    }
    // delete the token for non-3ds flow
    if (clearToken) {
        COHelpers.deletWPToken(clearToken);
    }
    if (cvvSessionHref) {
        delete session.privacy.cvvSessionHref;
        Logger.getLogger('worldpay').debug('Post order session cvv href deleted for non-3DS flow');
    }
    if (!empty(session.privacy.currentOrderNo)) {
        delete session.privacy.currentOrderNo;
    }
    return {};
}

module.exports = {
    postAuthorization: postAuthorization
};
