'use strict';

var server = require('server');
var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
var Logger = require('dw/system/Logger');
var URLUtils = require('dw/web/URLUtils');
var ArrayList = require('dw/util/ArrayList');
var Site = require('dw/system/Site');
var WorldpayConstants = require('*/cartridge/scripts/common/worldpayConstants');
/**
 * Notification for worldpay processor
 */
server.post('Notify', server.middleware.https, function (req, res, next) {
    var isValidateIPAddress = Boolean(Site.getCurrent().getCustomPreferenceValue('ValidateIPAddress'));
    var Utils = require('*/cartridge/scripts/common/utils');
    if (isValidateIPAddress) {
        var validateIPStatus = Utils.validateIP(req.connection.remoteAddress);
        if (validateIPStatus.error) {
            res.render('/http_500');
            return next();
        }
    }
    var JSONString = req.body;
    Logger.getLogger('worldpay').debug('Worldpay-Notify : Add Custom Object : JSONString IS ' + JSONString);
    if (JSONString == null) {
        Logger.getLogger('worldpay').error('Worldpay-Notify : Add Custom Object : JSONString IS NULL');
        res.render('/http_500');
        return next();
    }
    if (Utils.addNotifyCustomObjectAWP(JSONString).error) {
        res.render('/http_500');
        return next();
    }
    res.render('/notifyResponsejson', { error: false });
    return next();
});

server.post('Handle3ds', server.middleware.https, function (req, res, next) {
    var Utils = require('*/cartridge/scripts/common/utils');
    var reference3ds = request.httpParameterMap.TransactionId.rawValue.toString();
    var WorldpayPayment = require('*/cartridge/scripts/order/worldpayPayment');
    var md = request.httpParameterMap.MD.value;
    var orderNo = md.split('=')[1];
    if (!orderNo) {
        COHelpers.deleteSessionOrderNum();
        Logger.getLogger('worldpay').error('Worldpay.js HandleAuthenticationResponse :  Order no. not present in parameters');
        res.redirect(URLUtils.url('Cart-Show', 'placeerror', Utils.worldpayErrorMessage()));
        return next();
    }
    var OrderManager = require('dw/order/OrderMgr');
    var orderObj = null;
    var Order = require('dw/order/Order');
    var Resource = require('dw/web/Resource');
    try {
        orderObj = OrderManager.getOrder(orderNo);
    } catch (ex) {
        COHelpers.deleteSessionOrderNum();
        Logger.getLogger('worldpay').error('Worldpay.js HandleAuthenticationResponse :  Invalid Order ');
        res.redirect(URLUtils.url('Cart-Show', 'placeerror', Utils.worldpayErrorMessage()));
        return next();
    }

    var verificationResult3ds = WorldpayPayment.verification3ds(orderObj, reference3ds);
    var authorizationResponse3DS = null;
    if (verificationResult3ds.outcome === 'signatureFailed' || verificationResult3ds.outcome === 'authenticationFailed') {
        Logger.getLogger('worldpay').error('Worldpay.js Handle3ds - 3ds verification Failed ');
        Utils.failImpl(orderObj, '3ds verification Failed');
        res.redirect(URLUtils.https('Checkout-Begin', 'stage', 'placeOrder', 'placeerror', Utils.getErrorMessage('.' + verificationResult3ds.outcome)));
        return next();
    }
    var paymentforms = server.forms.getForm('billing').creditCardFields;
    var cvn = paymentforms.securityCode ? paymentforms.securityCode.value : '';
    authorizationResponse3DS = WorldpayPayment.authorizeAWP(orderNo, cvn, verificationResult3ds.authentication3ds);
    var clearToken = session.privacy.clearToken;

    // success handling
    if (orderObj == null) {
        res.redirect(URLUtils.url('Cart-Show'));
        return next();
    }
    if (orderObj.getStatus().value === Order.ORDER_STATUS_FAILED) {
        var error = Utils.worldpayErrorMessage();
        COHelpers.deleteSessionOrderNum();
        res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'payment', 'placeerror', error.errorMessage));
        return next();
    }

    if (authorizationResponse3DS.error) {
        Logger.getLogger('worldpay').error('Worldpay.js Handle3ds - Authorization Failed ');
        Utils.failImpl(orderObj, '3ds verification Failed');
        res.redirect(URLUtils.https('Checkout-Begin', 'stage', 'placeOrder', 'placeerror', authorizationResponse3DS.errorMessage));
        return next();
    }

    // Places the order
    var placeOrderResult = COHelpers.placeOrder(orderObj);
    if (placeOrderResult.error) {
        res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'payment', 'placeerror', Resource.msg('error.technical', 'checkout', null)));
        return next();
    }

    delete session.privacy.currentOrderNo;
    COHelpers.sendConfirmationEmail(orderObj, req.locale.id);
    // Reset usingMultiShip after successful Order placement
    req.session.privacyCache.set('usingMultiShipping', false);
    // delete the token in session and at WP token store
    if (clearToken) {
        COHelpers.deletWPToken(clearToken);
    }
    res.redirect(URLUtils.url('Order-Confirm', 'ID', orderObj.orderNo, 'token', orderObj.orderToken, 'canSaveCard', authorizationResponse3DS.canSavecard, 'hasUpdateLimitReached', authorizationResponse3DS.hasUpdateLimitReached).toString());
    return next();
});


server.post('Authenticate3ds', server.middleware.https, function (req, res, next) {
    var Utils = require('*/cartridge/scripts/common/utils');
    var orderNo = session.privacy.ThreeDsOrderNo;
    delete session.privacy.ThreeDsOrderNo;
    var OrderManager = require('dw/order/OrderMgr');
    var PaymentMgr = require('dw/order/PaymentMgr');
    var Order = require('dw/order/Order');
    var sessionID = request.httpParameterMap.dataSessionId.value;
    var Resource = require('dw/web/Resource');
    var error = null;
    var orderObj;
    var clearToken = session.privacy.clearToken;
    if (!orderNo) {
        Logger.getLogger('worldpay').error('Worldpay.js HandleAuthenticationResponse :  Order no. not present in parameters');
        res.json({
            error: true,
            redirectURL: URLUtils.url('Cart-Show', 'placeerror', Utils.getErrorMessage()).toString()
        });
        return next();
    }


    try {
        orderObj = OrderManager.getOrder(orderNo);
    } catch (ex) {
        Logger.getLogger('worldpay').error('Worldpay.js HandleAuthenticationResponse :  Invalid Order ');
        res.json({
            error: true,
            redirectURL: URLUtils.url('Cart-Show', 'placeerror', Utils.worldpayErrorMessage()).toString()
        });
        return next();
    }
    // Fetch the APM Name from the Payment isntrument.
    var paymentInstrument = Utils.getPaymentInstrument(orderObj);
    var apmName = paymentInstrument.getPaymentMethod();
    // Fetch the APM Type from the Payment Method i.e. if the Payment Methoid is of DIRECT or REDIRECT type.
    var paymentMthd = PaymentMgr.getPaymentMethod(apmName);
    var WorldpayPreferences = require('*/cartridge/scripts/object/worldpayPreferences');
    WorldpayPreferences = new WorldpayPreferences();
    var preferences = WorldpayPreferences.worldPayPreferencesInit(paymentMthd);

    if (preferences.missingPreferences()) {
        Logger.getLogger('worldpay').error('Worldpay.js HandleAuthenticationResponse : Worldpay preferences are not properly set.');
        error = Utils.worldpayErrorMessage();
        Utils.failImpl(orderObj, error.errorMessage);
        return { error: true, success: false, errorMessage: error.errorMessage, orderNo: orderObj.orderNo, orderToken: orderObj.orderToken };
    }
    // Capturing Issuer Response


    var authenticationRequest3Ds = require('*/cartridge/scripts/order/worldpayPayment').authenticate3ds(orderObj, paymentInstrument, preferences, sessionID);
    var authorizationResponse3DS = null;
    if (authenticationRequest3Ds.error) {
        Logger.getLogger('worldpay').error('Worldpay.js HandleAuthenticationResponse : ErrorCode : ' + authenticationRequest3Ds.errorCode + ' : Error Message : ' + authenticationRequest3Ds.errorMessage);
        Utils.failImpl(orderObj, authenticationRequest3Ds.errorMessage);
        res.json({
            error: true,
            redirectURL: URLUtils.url('Checkout-Begin', 'stage', 'placeOrder', 'placeerror', authenticationRequest3Ds.errorMessage).toString()
        });
        return next();
        // return {error : true, success : false, errorCode: SecondAuthorizeRequestResult.errorCode, errorMessage : SecondAuthorizeRequestResult.errorMessage, orderNo: orderObj.orderNo, orderToken: orderObj.orderToken};
    } else if (authenticationRequest3Ds.outcome === 'challenged') {
        session.privacy.challengeJWT = authenticationRequest3Ds.jwt;
        session.privacy.challengeURL = authenticationRequest3Ds.url;
        session.privacy.ThreeDsOrderNo = orderNo;
        res.json({
            error: false,
            outcome: authenticationRequest3Ds.outcome,
            continueURL: URLUtils.https('Worldpay-ShowChallenge').toString()
        });
        return next();
    } else if (authenticationRequest3Ds.outcome !== WorldpayConstants.AUTHENTICATION_FAILED) {
        var paymentforms = server.forms.getForm('billing').creditCardFields;
        var cvn = paymentforms.securityCode ? paymentforms.securityCode.value : '';
        authorizationResponse3DS = require('*/cartridge/scripts/order/worldpayPayment').authorizeAWP(orderNo, cvn, authenticationRequest3Ds.authentication3ds);
    } else if (authenticationRequest3Ds.outcome === WorldpayConstants.AUTHENTICATION_FAILED) {
        Logger.getLogger('worldpay').error('Worldpay.js HandleAuthenticationResponse - 3ds Authentication Failed ');
        Utils.failImpl(orderObj, '3ds Authentication Failed');
       /* if (clearToken) {
            COHelpers.deletWPToken(clearToken);
        }*/
        res.json({
            error: true,
            redirectURL: URLUtils.https('Checkout-Begin', 'stage', 'placeOrder', 'placeerror', Utils.getErrorMessage('.' + authenticationRequest3Ds.outcome)).toString()
        });
        return next();
    } else {
        Logger.getLogger('worldpay').error('Worldpay.js HandleAuthenticationResponse - Authentication Failed ');
        Utils.failImpl(orderObj, '3ds Authentication Failed');
        /* if (clearToken) {
            COHelpers.deletWPToken(clearToken);
        }*/
        res.json({
            error: true,
            redirectURL: URLUtils.https('Checkout-Begin', 'stage', 'placeOrder', 'placeerror', Utils.getErrorMessage()).toString()
        });
        return next();
    }


    // success handling
    if (orderObj == null) {
        res.json({
            error: true,
            redirectURL: URLUtils.url('Cart-Show')
        });
        return next();
    }
    if (orderObj.getStatus().value === Order.ORDER_STATUS_FAILED) {
        error = Utils.worldpayErrorMessage();
        res.json({
            error: true,
            redirectURL: URLUtils.url('Checkout-Begin', 'stage', 'payment', 'placeerror', error.errorMessage).toString()
        });
        return next();
    }

    if (authorizationResponse3DS.error) {
        if (Utils.failImpl(orderObj, authorizationResponse3DS.errorMessage).error) {
            if (!empty(session.privacy.currentOrderNo)) {
                delete session.privacy.currentOrderNo;
            }
            res.json({
                error: true,
                redirectURL: URLUtils.url('Cart-Show', 'placeerror', authorizationResponse3DS.errorMessage).toString()
            });
            return next();
        }
        res.json({
            error: true,
            redirectURL: URLUtils.url('Checkout-Begin', 'stage', 'payment', 'placeerror', authorizationResponse3DS.errorMessage).toString()
        });
        if (!empty(session.privacy.currentOrderNo)) {
            delete session.privacy.currentOrderNo;
        }
        return next();
    }

    // Places the order
    var placeOrderResult = COHelpers.placeOrder(orderObj);
    if (placeOrderResult.error) {
        res.json({
            error: true,
            redirectURL: URLUtils.url('Checkout-Begin', 'stage', 'payment', 'placeerror', Resource.msg('error.technical', 'checkout', null)).toString()
        });
        return next();
    }

    COHelpers.sendConfirmationEmail(orderObj, req.locale.id);
    // Reset usingMultiShip after successful Order placement
    req.session.privacyCache.set('usingMultiShipping', false);
    // delete the token in session and at WP token store
    if (clearToken) {
        COHelpers.deletWPToken(clearToken);
    }
    res.json({
        error: false,
        redirectURL: URLUtils.url('Order-Confirm', 'ID', orderObj.orderNo, 'token', orderObj.orderToken, 'canSaveCard', authorizationResponse3DS.canSavecard, 'hasUpdateLimitReached', authorizationResponse3DS.hasUpdateLimitReached).toString()
    });
    return next();
});

/**
* Service to get Notification updates (latest update and all updates) based on parameter "allupdates"
*/

server.get('GetNotificationUpdates', server.middleware.https, function (req, res, next) {
    var Utils = require('*/cartridge/scripts/common/utils');
    var params = request.getHttpParameters();
    var orderNo = (params.containsKey('orderNo')) ? params.get('orderNo')[0] : null;
    var allupdates = (params.containsKey('allupdates')) ? params.get('allupdates')[0] : '';
    var errorCode;
    var errorMessage;
    var orderObj;
    if (orderNo) {
        try {
            var OrderMgr = require('dw/order/OrderMgr');
            orderObj = OrderMgr.getOrder(orderNo);
        } catch (ex) {
            errorCode = WorldpayConstants.NOTIFYERRORCODE120;
            errorMessage = Utils.getErrorMessage(errorCode);
            res.render('/errorjson', {
                ErrorCode: errorCode,
                ErrorMessage: errorMessage
            }
            );
            return next();
        }
        if (orderObj) {
            try {
                var statusHist = orderObj.custom.AWPtransactionStatus;
                var statusList = new ArrayList(statusHist);
                if (!statusList || statusList.length <= 0) {
                    if (allupdates.equalsIgnoreCase('true')) {
                        errorCode = WorldpayConstants.NOTIFYERRORCODE118;
                    } else {
                        errorCode = WorldpayConstants.NOTIFYERRORCODE119;
                    }
                    errorMessage = Utils.getErrorMessage(errorCode);
                    res.render('/errorjson', {
                        ErrorCode: errorCode,
                        ErrorMessage: errorMessage
                    }
                    );
                } else if (allupdates.equalsIgnoreCase('true')) {
                    res.render('/allstatusjson',
                        { statusList: statusList }
                    );
                } else {
                    res.render('/lateststatusjson',
                        { status: statusList.get(0) }
                    );
                }
            } catch (ex) {
                errorCode = WorldpayConstants.NOTIFYERRORCODE115;
                errorMessage = Utils.getErrorMessage(errorCode);
                Logger.getLogger('worldpay').error('Order Notification : Get All Status Update Notifications recieved : ' + errorCode + ' : ' + errorMessage + ' : ' + ex);
                res.render('/errorjson', {
                    ErrorCode: errorCode,
                    ErrorMessage: errorMessage
                }
                );
            }
            return next();
        }
    }
    errorCode = WorldpayConstants.NOTIFYERRORCODE120;
    errorMessage = Utils.getErrorMessage(errorCode);
    res.render('/errorjson', {
        ErrorCode: errorCode,
        ErrorMessage: errorMessage
    }
    );
    return next();
});

server.get('Ddc', server.middleware.https, function (req, res, next) {
    var JWT = session.privacy.JWT;
    var bin = session.privacy.bin;
    var ddcURL = session.privacy.ddcURL;
    delete session.privacy.JWT;
    delete session.privacy.bin;
    delete session.privacy.ddcURL;
    res.render('/checkout/ddciframe', {
        JWT: JWT,
        bin: bin,
        ddcURL: ddcURL
    });
    return next();
});

server.get('ShowChallenge', server.middleware.https, function (req, res, next) {
    var orderNo = session.privacy.ThreeDsOrderNo;
    var JWT = session.privacy.challengeJWT;
    var URL = session.privacy.challengeURL;
    delete session.privacy.ThreeDsOrderNo;
    delete session.privacy.challengeJWT;
    delete session.privacy.challengeURL;
    res.render('/checkout/challengeContent', {
        orderNo: orderNo,
        JWT: JWT,
        URL: URL
    });
    return next();
});

server.post('GetVerifiedToken', server.middleware.https, function (req, res, next) {
    var customer = null;
    var CurrentCustomerProfile = req.currentCustomer.profile;
    if (CurrentCustomerProfile) {
        customer = req.currentCustomer.profile.customerNo;
    }
    var sessionID = request.httpParameterMap.sessCard.value.toString();
    var wsdkname = request.httpParameterMap.wsdkname.value.toString();
    if (wsdkname && sessionID) {
        var getVerifiedToken = require('*/cartridge/scripts/order/worldpayPayment').getVerifiedToken(sessionID, wsdkname, customer);
        res.json({
            error: getVerifiedToken.error,
            verified: getVerifiedToken.verified,
            servererror: getVerifiedToken.servererror,
            updateLimitCrossed: getVerifiedToken.updateLimitCrossed,
            cardUpdated: getVerifiedToken.cardUpdateResult,
            cardExists: getVerifiedToken.cardExists
        });
    }
    return next();
});

module.exports = server.exports();
