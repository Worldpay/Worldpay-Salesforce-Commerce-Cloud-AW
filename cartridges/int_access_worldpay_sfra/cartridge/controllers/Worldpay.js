'use strict';

var server = require('server');
var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
var Logger = require('dw/system/Logger');
var URLUtils = require('dw/web/URLUtils');
var ArrayList = require('dw/util/ArrayList');
var Site = require('dw/system/Site');
var worldpayConstants = require('*/cartridge/scripts/common/worldpayConstants');
var PaymentInstrument = require('dw/order/PaymentInstrument');
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
    res.render('/notifyResponseJson', { error: false });
    return next();
});

server.post('Handle3ds', server.middleware.https, function (req, res, next) {
    var Utils = require('*/cartridge/scripts/common/utils');
    var reference3ds = request.httpParameterMap.TransactionId.rawValue.toString();
    var worldpayPayment = require('*/cartridge/scripts/order/worldpayPayment');
    var ccSecurityModel = Site.current.getCustomPreferenceValue('ccSecurityModel').value;
    var md = request.httpParameterMap.MD.value;
    var orderNo = md.split('=')[1];
    if (!orderNo) {
        COHelpers.deleteSessionOrderNum();
        Logger.getLogger('worldpay').error('Worldpay.js HandleAuthenticationResponse :  Order no. not present in parameters');
        res.redirect(URLUtils.url('Cart-Show', 'placeerror', Utils.getErrorMessage()));
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
        res.redirect(URLUtils.url('Cart-Show', 'placeerror', Utils.getErrorMessage()));
        return next();
    }
    var paymentInstrument = Utils.getPaymentInstrument(orderObj);
    var verificationResult3ds = worldpayPayment.verification3ds(orderObj, reference3ds);
    var authorizationResponse3DS = null;
    if (verificationResult3ds.outcome === 'signatureFailed' || verificationResult3ds.outcome === 'authenticationFailed') {
        Logger.getLogger('worldpay').error('Worldpay.js Handle3ds - 3ds verification Failed ');
        Utils.failImpl(orderObj, '3ds verification Failed');
        if (session.privacy.isInstantPurchaseBasket) {
            delete session.privacy.isInstantPurchaseBasket;
            res.redirect(URLUtils.https('Cart-Show', 'cart-error', 'carterror').toString());
        } else {
            res.redirect(URLUtils.https('Checkout-Begin', 'stage', 'placeOrder', 'placeerror', Utils.getConfiguredLabel('worldpay.error.code.' + verificationResult3ds.outcome, 'worldpayError')));
        }
        return next();
    }
    var paymentforms = server.forms.getForm('billing').creditCardFields;
    var cvn = paymentforms.securityCode ? paymentforms.securityCode.value : '';
    var apmName = paymentInstrument.getPaymentMethod();
    if ((paymentInstrument.paymentMethod.equals(PaymentInstrument.METHOD_CREDIT_CARD) && ccSecurityModel === 'WEB_SDK')) {
        authorizationResponse3DS = worldpayPayment.initiateWebSDKAuthorization(orderNo, cvn, verificationResult3ds.authentication3ds);
    } else if (paymentInstrument.paymentMethod.equals(PaymentInstrument.METHOD_CREDIT_CARD) && ccSecurityModel === 'DIRECT') {
        authorizationResponse3DS = worldpayPayment.initiateDirectAuthorization(orderNo, cvn, verificationResult3ds.authentication3ds);
    } else if (apmName.equals(worldpayConstants.GOOGLEPAY)) {
        authorizationResponse3DS = worldpayPayment.initiateGPayAuthorization(orderNo);
    } else {
        authorizationResponse3DS = { authorized: true };
    }
    // local variables are created for the below session attributes to keep them alive during 3DS challenge page.
    var clearToken = session.privacy.clearToken;
    var cvvSessionHref = session.privacy.cvvSessionHref;
    // success handling
    if (orderObj == null) {
        res.redirect(URLUtils.url('Cart-Show'));
        return next();
    }
    if (orderObj.getStatus().value === Order.ORDER_STATUS_FAILED) {
        var error = Utils.getErrorMessage();
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
    if (cvvSessionHref) {
        delete session.privacy.cvvSessionHref;
        Logger.getLogger('worldpay').debug('Post order session cvv href deleted');
    }

    res.render('/checkout/orderConfirmForm', {
        error: false,
        orderID: orderObj.orderNo,
        orderToken: orderObj.orderToken,
        continueUrl: URLUtils.url('Order-Confirm').toString()
    });
    return next();
});


server.post('Authenticate3ds', server.middleware.https, function (req, res, next) {
    var Utils = require('*/cartridge/scripts/common/utils');
    var orderNo = session.privacy.ThreeDsOrderNo;
    delete session.privacy.ThreeDsOrderNo;
    var OrderManager = require('dw/order/OrderMgr');
    var PaymentMgr = require('dw/order/PaymentMgr');
    var Order = require('dw/order/Order');
    var worldpayPayment = require('*/cartridge/scripts/order/worldpayPayment');
    var sessionID = request.httpParameterMap.dataSessionId.value;
    var Resource = require('dw/web/Resource');
    var ccSecurityModel = Site.current.getCustomPreferenceValue('ccSecurityModel').value;
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
            redirectURL: URLUtils.url('Cart-Show', 'placeerror', Utils.getErrorMessage()).toString()
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
        error = Utils.getErrorMessage();
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
    } else if (authenticationRequest3Ds.outcome !== worldpayConstants.AUTHENTICATION_FAILED) {
        var paymentforms = server.forms.getForm('billing').creditCardFields;
        var tokenDeleteRequired = COHelpers.authenticationRequest3DsOutcome(authenticationRequest3Ds.outcome);
        if (tokenDeleteRequired) {
            var customerAuthenticated = req.currentCustomer.profile;
            if (customerAuthenticated && paymentforms.saveCard.checked && clearToken) {
                delete session.privacy.clearToken;
                clearToken = null;
            }
        }
        var cvn = paymentforms.securityCode ? paymentforms.securityCode.value : '';
        if ((paymentInstrument.paymentMethod.equals(PaymentInstrument.METHOD_CREDIT_CARD) && ccSecurityModel === 'WEB_SDK')) {
            authorizationResponse3DS = worldpayPayment.initiateWebSDKAuthorization(orderNo, cvn, authenticationRequest3Ds.authentication3ds);
        } else if (paymentInstrument.paymentMethod.equals(PaymentInstrument.METHOD_CREDIT_CARD) && ccSecurityModel === 'DIRECT') {
            authorizationResponse3DS = worldpayPayment.initiateDirectAuthorization(orderNo, cvn, authenticationRequest3Ds.authentication3ds);
        } else if (apmName.equals(worldpayConstants.GOOGLEPAY)) {
            authorizationResponse3DS = worldpayPayment.initiateGPayAuthorization(orderNo);
        } else {
            authorizationResponse3DS = { authorized: true };
        }
    } else if (authenticationRequest3Ds.outcome === worldpayConstants.AUTHENTICATION_FAILED) {
        Logger.getLogger('worldpay').error('Worldpay.js HandleAuthenticationResponse - 3ds Authentication Failed ');
        Utils.failImpl(orderObj, '3ds Authentication Failed');
        if (session.privacy.isInstantPurchaseBasket) {
            delete session.privacy.isInstantPurchaseBasket;
            res.json({
                error: true,
                redirectURL: URLUtils.https('Cart-Show', 'cart-error', 'carterror').toString()
            });
        } else {
            res.json({
                error: true,
                redirectURL: URLUtils.https('Checkout-Begin', 'stage', 'placeOrder', 'placeerror', Utils.getConfiguredLabel('worldpay.error.code.' + authenticationRequest3Ds.outcome, 'worldpayError')).toString()
            });
        }
        return next();
    } else {
        Logger.getLogger('worldpay').error('Worldpay.js HandleAuthenticationResponse - Authentication Failed ');
        Utils.failImpl(orderObj, '3ds Authentication Failed');
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
        error = Utils.getErrorMessage();
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
    session.privacy.ThreeDsOrderNo = orderObj.orderNo;
    session.privacy.orderToken = orderObj.orderToken;
    res.json({
        error: false,
        redirectURL: URLUtils.url('Worldpay-ShowOderConfirm').toString()
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
    var errorJson;
    var orderObj;
    if (orderNo) {
        try {
            var OrderMgr = require('dw/order/OrderMgr');
            orderObj = OrderMgr.getOrder(orderNo);
        } catch (ex) {
            errorCode = worldpayConstants.NOTIFYERRORCODE120;
            errorJson = Utils.getErrorJson(errorCode);
            res.render('/errorjson', {
                errorJson: errorJson
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
                        errorCode = worldpayConstants.NOTIFYERRORCODE118;
                    } else {
                        errorCode = worldpayConstants.NOTIFYERRORCODE119;
                    }
                    errorJson = Utils.getErrorJson(errorCode);
                    res.render('/errorjson', {
                        errorJson: errorJson
                    }
                    );
                } else if (allupdates.equalsIgnoreCase('true')) {
                    res.render('/allStatusJson',
                        { statusList: statusList }
                    );
                } else {
                    var object = {};
                    var latestStatus = statusList.get(0);
                    object.latestStatus = [];
                    object.latestStatus.push({ Status: latestStatus });
                    var ojson = JSON.stringify(object);
                    res.render('/latestStatusJson',
                        { ojson: ojson }
                    );
                }
            } catch (ex) {
                errorCode = worldpayConstants.NOTIFYERRORCODE115;
                errorJson = Utils.getErrorJson(errorCode);
                Logger.getLogger('worldpay').error('Order Notification : Get All Status Update Notifications recieved : ' + errorCode + ' : errorMessage : ' + Utils.getErrorMessage(errorCode));
                res.render('/errorjson', {
                    errorJson: errorJson
                }
                );
            }
            return next();
        }
    }
    errorCode = worldpayConstants.NOTIFYERRORCODE120;
    errorJson = Utils.getErrorJson(errorCode);
    res.render('/errorjson', {
        errorJson: errorJson
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
    if (!URL || !JWT || !orderNo) {
        res.redirect(URLUtils.url('Checkout-Begin'));
        return next();
    }
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

/**
* Service to set the cvv href in session.
*/
server.post('SessionHref', server.middleware.https, function (req, res, next) {
    var sessionCVV = request.httpParameterMap.sessCVV.value.toString();
    if (session.privacy.cvvSessionHref) {
        Logger.getLogger('worldpay').debug('Cleared existing cvv href in session');
        delete session.privacy.cvvSessionHref;
    }
    session.privacy.cvvSessionHref = sessionCVV;
    Logger.getLogger('worldpay').debug('Pushed cvv href in session');
    res.json({
        success: true
    });
    return next();
});

/**
* Service to clear the cvv href in session.
*/
server.get('ClearSessionHref', server.middleware.https, function (req, res, next) {
    if (session.privacy.cvvSessionHref) {
        Logger.getLogger('worldpay').debug('Cleared cvv href in session');
        delete session.privacy.cvvSessionHref;
    }
    res.json({
        success: true
    });
    return next();
});

/**
* Method that does a form submission, to render the Order Confirmation page
*/
server.get('ShowOderConfirm', server.middleware.https, function (req, res, next) {
    var orderNo = session.privacy.ThreeDsOrderNo;
    var orderToken = session.privacy.orderToken;
    delete session.privacy.ThreeDsOrderNo;
    delete session.privacy.orderToken;
    res.render('/checkout/orderConfirmForm', {
        error: false,
        orderID: orderNo,
        orderToken: orderToken,
        continueUrl: URLUtils.url('Order-Confirm').toString()
    });
    return next();
});

/**
 * Service to create applicable payment methods when billing address county is changed.
*/
server.get('APMLookupService', function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var Locale = require('dw/util/Locale');
    var PaymentModel = require('*/cartridge/models/payment');
    var Transaction = require('dw/system/Transaction');
    var currentBasket = BasketMgr.getCurrentBasket();
    if (!currentBasket) {
        res.redirect(URLUtils.url('Cart-Show'));
        return next();
    }
    var currentCustomer = req.currentCustomer.raw;
    var currentLocale = Locale.getLocale(req.locale.id);
    var lookupCountry = req.querystring.lookupCountry;
    var shippingCountry = req.querystring.shippingCountry;
    var currentCountry = lookupCountry || currentLocale.country;
    if (shippingCountry && currentBasket.billingAddress && currentBasket.billingAddress.countryCode.value) {
        currentCountry = currentBasket.billingAddress.countryCode.value;
    } else if (shippingCountry) {
        currentCountry = shippingCountry;
    }
    // Loop through all shipments and make sure all are valid
    var isValid;
    var allValid = true;
    for (var i = 0, ii = currentBasket.shipments.length; i < ii; i++) {
        isValid = req.session.privacyCache.get(currentBasket.shipments[i].UUID);
        if (isValid !== 'valid') {
            allValid = false;
            break;
        }
    }

    if (currentBasket.billingAddress) {
        Transaction.wrap(function () { /* eslint-disable */
            currentBasket.billingAddress.setCountryCode(currentCountry);
        });
    }
    var usingMultiShipping = req.session.privacyCache.get('usingMultiShipping');
    var OrderModel = require('*/cartridge/models/order');
    var orderModel = new OrderModel(
        currentBasket,
        {
            customer: currentCustomer,
            usingMultiShipping: usingMultiShipping,
            shippable: allValid,
            countryCode: currentLocale.country,
            containerView: 'basket'
        }
    );
    var paymentModel = new PaymentModel(currentBasket, currentCustomer, currentCountry);
    orderModel.billing.payment = paymentModel;
    if (!orderModel.billing.billingAddress.address) {
        var AddressModel = require('*/cartridge/models/address');
        orderModel.billing.billingAddress = new AddressModel(currentBasket.defaultShipment.shippingAddress);
    }

    var applicablePMResult = require('*/cartridge/scripts/order/worldpayPayment').applicablePaymentMethods();
    var applicableAPMs = applicablePMResult.applicableAPMs;
    var applicableAPMsUpdated = new ArrayList();

    var lineItemItr = applicableAPMs.iterator();
    while (lineItemItr.hasNext()) {
        var ali = lineItemItr.next();
        if (ali.ID == worldpayConstants.ACHPAY && lookupCountry != worldpayConstants.LOOKUPCOUNTRY) {
            continue;
        }
        applicableAPMsUpdated.push(ali);
    }
    var currentYear = new Date().getFullYear();
    var creditCardExpirationYears = [];

    for (var j = 0; j < 20; j++) {
        creditCardExpirationYears.push(currentYear + j);
    }
    orderModel.billing.payment.applicablePaymentMethods = applicableAPMsUpdated;
    var AccountModel = require('*/cartridge/models/account');
    var accountModel = new AccountModel(req.currentCustomer);
    res.render('/checkout/billing/paymentOptions', {
        order: orderModel,
        customer: accountModel,
        applicableAPMs: applicableAPMs,
        expirationYears: creditCardExpirationYears,
        lookupCountry: lookupCountry,
        forms: {
            billingForm: server.forms.getForm('billing')
        }
    });
    return next();
});

module.exports = server.exports();
