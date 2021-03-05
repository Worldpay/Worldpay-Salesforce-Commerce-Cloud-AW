'use strict';

var ArrayList = require('dw/util/ArrayList');
var Logger = require('dw/system/Logger');
var PaymentInstrument = require('dw/order/PaymentInstrument');
var PaymentInstrumentUtils = require('*/cartridge/scripts/common/paymentInstrumentUtils');
var PaymentMgr = require('dw/order/PaymentMgr');
var Transaction = require('dw/system/Transaction');
var WorldpayConstants = require('*/cartridge/scripts/common/worldpayConstants');
var ServiceFacade = require('*/cartridge/scripts/service/serviceFacade');
var CardHelper = require('*/cartridge/scripts/common/cardHelper');

/**
 * Update Token in payment Instrument for customer save payent instrument
 * @param {dw.order.PaymentInstrument} paymentInstrumentObj -  The payment instrument to update token
 * @param {dw.customer.Customer} customer -  The customer where the token value to preseve in saved cards
 * @return {Object} returns an error object
 */
function updateToken(paymentInstrumentObj, customer) {
    var WorldpayPreferences = require('*/cartridge/scripts/object/worldpayPreferences');
    var worldPayPreferences = new WorldpayPreferences();
    var preferences = worldPayPreferences.worldPayPreferencesInit();
    var EnableTokenizationPref = preferences.EnableCCTokenization;
    var cardNumber = paymentInstrumentObj.creditCardNumber;
    var cardType = paymentInstrumentObj.creditCardType;
    var expirationMonth = paymentInstrumentObj.creditCardExpirationMonth;
    var expirationYear = paymentInstrumentObj.creditCardExpirationYear;
    var CCTokenRequestResult;
    if (customer && customer.authenticated && EnableTokenizationPref) {
        var wallet = customer.getProfile().getWallet();
        var customerPaymentInstruments = wallet.getPaymentInstruments(PaymentInstrument.METHOD_CREDIT_CARD);
        try {
            var paymentInstrument;
            Transaction.begin();
            paymentInstrument = wallet.createPaymentInstrument('CREDIT_CARD');
            paymentInstrument.setCreditCardHolder(paymentInstrumentObj.creditCardHolder);
            paymentInstrument.setCreditCardNumber(cardNumber);
            paymentInstrument.setCreditCardType(cardType);
            paymentInstrument.setCreditCardExpirationMonth(expirationMonth);
            paymentInstrument.setCreditCardExpirationYear(expirationYear);
            CCTokenRequestResult = ServiceFacade.ccIntelligentTokenRequestServiceAWP(paymentInstrument, preferences, customer);
            var serviceResponse = CCTokenRequestResult.serviceResponse;

            if (!CCTokenRequestResult.error) {
                var result = PaymentInstrumentUtils.validateTokenServiceResponse(CCTokenRequestResult, paymentInstrument);
                var matchedPaymentInstrument = PaymentInstrumentUtils.getTokenPaymentInstrument(customerPaymentInstruments, serviceResponse);
                if (result.success) {
                    if (!matchedPaymentInstrument) {
                        Logger.debug('matchedPaymentInstrument not found setting credit card token:' + serviceResponse.tokenUrl + ' and awpCCTokenData:' + serviceResponse.tokenId);
                        if (paymentInstrument && Object.prototype.hasOwnProperty.call(serviceResponse, 'tokenId')) {
                            paymentInstrument.custom.awpCCTokenData = serviceResponse.tokenUrl;
                            paymentInstrument.setCreditCardToken(serviceResponse.tokenId);
                            Transaction.commit();
                            return {
                                error: false
                            };
                        }
                    } else if (result.solvedConflictsCount > 0 && matchedPaymentInstrument) {
                        Transaction.wrap(function () {
                            wallet.removePaymentInstrument(matchedPaymentInstrument);
                        });
                        if (paymentInstrument.custom.nameTokenConflictResolved) {
                            paymentInstrument.setCreditCardHolder(paymentInstrumentObj.creditCardHolder);
                        }
                        if (paymentInstrument.custom.dateTokenConflictResolved) {
                            paymentInstrument.setCreditCardExpirationMonth(expirationMonth);
                            paymentInstrument.setCreditCardExpirationYear(expirationYear);
                        }
                        paymentInstrument.custom.awpCCTokenData = serviceResponse.tokenUrl;
                        paymentInstrument.setCreditCardToken(serviceResponse.tokenId);
                        Transaction.commit();
                        return {
                            error: false
                        };
                    } else {
                        Transaction.rollback();
                        return {
                            error: true,
                            tokenConflict: true
                        };
                    }
                } else {
                    Transaction.rollback();
                    if (result.verfied === false) {
                        return { verfied: false, error: true };
                    }
                    if (result.updateLimitCrossed) {
                        return { updateLimitCrossed: true, error: true };
                    }
                }
            } else {
                Transaction.rollback();
                return {
                    error: true,
                    servererror: true
                };
            }
        } catch (ex) {
            Logger.getLogger('worldpay').error('worldpay-UpdateToken error recieved : ' + ex.message);
        }
    }
    return {};
}

/**
 * Handle credit card data
 * @param {dw.order.Basket} basket -  current basket
 * @param {Object} paymentInformation - credit card details
 * @return {Object} returns an error object
 */
function handleCreditCardAWP(basket, paymentInformation) {
    var currentBasket = basket;
    var WorldpayPreferences = require('*/cartridge/scripts/object/worldpayPreferences');
    var worldPayPreferences = new WorldpayPreferences();
    var preferences = worldPayPreferences.worldPayPreferencesInit();
    var EnableTokenizationPref = preferences.EnableCCTokenization;
    Transaction.wrap(function () {
        PaymentInstrumentUtils.removeExistingPaymentInstruments(currentBasket);

        var paymentInstrument = currentBasket.createPaymentInstrument(
            PaymentInstrument.METHOD_CREDIT_CARD, paymentInformation.paymentPrice
        );
        var cardNumber = paymentInformation.cardNumber.value;
        var expirationMonth = paymentInformation.expirationMonth.value;
        var expirationYear = paymentInformation.expirationYear.value;
        var holderName = paymentInformation.cardOwner.value;
        var cardType = paymentInformation.cardType.value;
        paymentInstrument.setCreditCardHolder(holderName);
        paymentInstrument.setCreditCardNumber(cardNumber);
        paymentInstrument.setCreditCardType(cardType);
        paymentInstrument.setCreditCardExpirationMonth(expirationMonth);
        paymentInstrument.setCreditCardExpirationYear(expirationYear);
        if (!empty(paymentInformation.creditCardTokenData)) {
            paymentInstrument.custom.awpCCTokenData = paymentInformation.creditCardTokenData;
            paymentInstrument.custom.awpCCTokenExpiry = paymentInformation.creditCardTokenExpiry;
        } else if (paymentInformation.saveCard && paymentInformation.saveCard.value && EnableTokenizationPref) {
            paymentInstrument.custom.wpTokenRequested = true;
        }
    });

    return { fieldErrors: {}, serverErrors: {}, error: false, success: true };
}

/**
 * Create an authentication request to 3ds
 * @param {dw.order.Order} orderObj -  current order object
 * @param {dw.order.PaymentInstrument} paymentInstrument - order payment instrument
 * @param {Object} preferences - worldpay site preferences
 * @param {string} sessionID - sessionID returned from ddc
 * @return {Object} returns an error object
 */
function authenticate3ds(orderObj, paymentInstrument, preferences, sessionID) {
    var authenticationRequest3Ds = require('*/cartridge/scripts/service/serviceFacade').authenticationRequest3Ds(orderObj, paymentInstrument, preferences, sessionID);
    if (authenticationRequest3Ds.error) {
        return {
            error: true,
            errorCode: authenticationRequest3Ds.errorCode,
            errorMessage: authenticationRequest3Ds.errorMessage
        };
    }
    return {
        error: false,
        outcome: authenticationRequest3Ds.serviceresponse.outcome,
        url: authenticationRequest3Ds.serviceresponse.challengeURL,
        reference: authenticationRequest3Ds.serviceresponse.challengeReference,
        jwt: authenticationRequest3Ds.serviceresponse.challengeJWT,
        authentication3ds: authenticationRequest3Ds.serviceresponse.authentication3ds
    };
}

/**
 * Create JWT Token for ddc
 * @param {string} orderNumber -  current order number
 * @return {Object} returns an error object
 */
function createJWTToken(orderNumber) {
    var OrderMgr = require('dw/order/OrderMgr');
    var order = OrderMgr.getOrder(orderNumber);
    var WorldpayPreferences = require('*/cartridge/scripts/object/worldpayPreferences');
    var apmName;
    var paymentMthd;
    var preferences;
    // initialize worldpay preferences
    var worldPayPreferences = new WorldpayPreferences();

    // order not found
    if (!order) {
        Logger.getLogger('worldpay').error('authorize : Invalid Order');
        return { error: true };
    }
    var pi;
    var paymentInstruments = order.getPaymentInstruments();
    if (paymentInstruments.length > 0) {
        Transaction.wrap(function () {
            for (var i = 0; i < paymentInstruments.length; i++) {
                pi = paymentInstruments[i];
                var payProcessor = PaymentMgr.getPaymentMethod(pi.getPaymentMethod()).getPaymentProcessor();
                if (payProcessor != null && payProcessor.getID().equalsIgnoreCase(WorldpayConstants.WORLDPAY)) {
                    // update payment instrument with transaction basic attrubutes
                    apmName = pi.getPaymentMethod();
                    paymentMthd = PaymentMgr.getPaymentMethod(apmName);
                    preferences = worldPayPreferences.worldPayPreferencesInit(paymentMthd);
                    pi.paymentTransaction.transactionID = orderNumber;
                    pi.paymentTransaction.paymentProcessor = payProcessor;
                    break;
                }
            }
        });
    }
    var JWTTokenRequestResult = ServiceFacade.jwtTokenRequest(order, pi, preferences);
    var serviceResponse = JWTTokenRequestResult.serviceresponse;
    if (serviceResponse && !JWTTokenRequestResult.error) {
        return {
            is3D: true,
            error: false,
            JWT: serviceResponse.JWT,
            ddcURL: serviceResponse.ddcURL,
            bin: serviceResponse.bin
        };
    }
    return {
        error: true,
        errorCode: serviceResponse && serviceResponse.errorCode ? serviceResponse.errorCode : JWTTokenRequestResult.errorCode,
        errorMessage: serviceResponse && serviceResponse.errorMessage ? serviceResponse.errorMessage : JWTTokenRequestResult.errorMessage

    };
}

/**
 * Verifies selected payment APM with their form fields information is a valid.
 * If the information is valid payment instrument is created.
 * @param {dw.order.Basket} basket - Current users's basket
 * @param {Object} paymentInformation - the payment information
 * @return {Object} returns an error object
 */
function handleAPM(basket, paymentInformation) {
    var paramMap = request.httpParameterMap;
    var paymentInstrument;
    var fieldErrors = {};
    var serverErrors = [];
    var paymentMethod = paymentInformation.selectedPaymentMethodID.value;
    Transaction.wrap(function () {
        PaymentInstrumentUtils.removeExistingPaymentInstruments(basket);
        paymentInstrument = basket.createPaymentInstrument(
            paymentMethod, paymentInformation.paymentPrice
        );
        if (paymentMethod.equals(WorldpayConstants.GOOGLEPAY)) {
            paymentInstrument.custom.gpayToken = paramMap.gpaytoken;
        }
    });
    return { fieldErrors: fieldErrors, serverErrors: serverErrors, error: false, success: true };
}

/**
 * Sets response Urls to the order custom attribute
 * @param {Object} serviceResponse - Response
 * @param {Object} orderObj - order object
 */
function setURLs(serviceResponse, orderObj) {
    var order = orderObj;

    Transaction.wrap(function () {
        if (serviceResponse.cancelUrl) {
            order.custom.awpCancelUrl = serviceResponse.cancelUrl;
            order.custom.oms_worldpay__awpCancelUrl = serviceResponse.cancelUrl;
        }
        if (serviceResponse.settleUrl) {
            order.custom.awpSettleUrl = serviceResponse.settleUrl;
            order.custom.oms_worldpay__awpSettleUrl = serviceResponse.settleUrl;
        }

        if (serviceResponse.partialSettleUrl) {
            order.custom.awpPartialSettleUrl = serviceResponse.partialSettleUrl;
            order.custom.oms_worldpay__awpPartialSettleUrl = serviceResponse.partialSettleUrl;
        }
        order.custom.awpCurrencyCode = order.currencyCode;
        order.custom.oms_worldpay__awpCurrencyCode = order.currencyCode;
        if (serviceResponse.outcome !== '') {
            order.custom.WorldpayLastEvent = serviceResponse.outcome;
        }
    });
}

/**
 * Authorizes a payment using a credit card. Customizations may use other processors and custom
 *      logic to authorize credit card payment.
 * @param {number} orderNumber - The current order's number
 * @param {string} cvn - card cvn
 * @param {Object} authentication3ds - 3ds authentication data
 * @param {string} orderType - orderType eg. moto
 * @return {Object} returns an error object
 */
function authorizeAWP(orderNumber, cvn, authentication3ds, orderType) {
    var OrderMgr = require('dw/order/OrderMgr');
    var Site = require('dw/system/Site');
    var authenticationData3ds = authentication3ds;
    var WorldpayPreferences = require('*/cartridge/scripts/object/worldpayPreferences');
    var TokenProcessUtils = require('*/cartridge/scripts/common/tokenProcessUtils');
    var Resource = require('dw/web/Resource');
    var serverErrors = [];
    var fieldErrors = {};
    var ccSecurityModel = Site.current.getCustomPreferenceValue('ccSecurityModel').value;
    // fetch order object
    var order = OrderMgr.getOrder(orderNumber);
    // fetch the APM Name or payment method name from the Payment instrument.
    var apmName;
    var paymentMthd;
    var preferences;
    var customerObj;
    // initialize worldpay preferences
    var worldPayPreferences = new WorldpayPreferences();

    // order not found
    if (!order) {
        Logger.getLogger('worldpay').error('authorize : Invalid Order');
        serverErrors.push(Resource.msg('error.technical', 'checkout', null));
        return { fieldErrors: fieldErrors, serverErrors: serverErrors, error: true };
    }
    var pi;
    var paymentInstruments = order.getPaymentInstruments();
    if (paymentInstruments.length > 0) {
        Transaction.wrap(function () {
            for (var i = 0; i < paymentInstruments.length; i++) {
                pi = paymentInstruments[i];
                var payProcessor = PaymentMgr.getPaymentMethod(pi.getPaymentMethod()).getPaymentProcessor();
                if (payProcessor != null && payProcessor.getID().equalsIgnoreCase(WorldpayConstants.WORLDPAY)) {
                    // update payment instrument with transaction basic attributes
                    apmName = pi.getPaymentMethod();
                    paymentMthd = PaymentMgr.getPaymentMethod(apmName);
                    preferences = worldPayPreferences.worldPayPreferencesInit(paymentMthd);
                    pi.paymentTransaction.transactionID = orderNumber;
                    pi.paymentTransaction.paymentProcessor = payProcessor;
                    break;
                }
            }
        });
    }

    // credit card direct APM authorization flow
    if (pi.paymentMethod.equals(PaymentInstrument.METHOD_CREDIT_CARD) && ccSecurityModel === 'DIRECT') {
        if (preferences.threeDSType.value.equals('two3d') && !authentication3ds && orderType !== WorldpayConstants.MOTO_ORDER) {
            return createJWTToken(orderNumber);
        }

        // Auth service call
        var CCAuthorizeRequestResult = ServiceFacade.ccAuthorizeRequestServiceAWP(order, cvn, pi, preferences, authenticationData3ds);
        if (CCAuthorizeRequestResult.error) {
            var errorMessage = Resource.msg('worldpay.error.code' + CCAuthorizeRequestResult.errorCode, 'worldpayerror', null);
            Logger.getLogger('worldpay').error('Worldpyay helper SendCCAuthorizeRequest : ErrorCode : ' + CCAuthorizeRequestResult.errorCode + ' : Error Message : ' + errorMessage);

            serverErrors.push(errorMessage);
            return { fieldErrors: fieldErrors, serverErrors: serverErrors, error: true, errorCode: CCAuthorizeRequestResult.errorCode, errorMessage: errorMessage };
        }

        var serviceResponse = CCAuthorizeRequestResult.serviceresponse;
        if (serviceResponse) {
            setURLs(serviceResponse, order);
        }
        // save token details in order object
        var CCTokenRequestResult = null;
        if (preferences.EnableCCTokenization && customer.authenticated && (pi.custom.wpTokenRequested ||
            (!empty(pi.custom.awpCCTokenExpiry) && pi.custom.awpCCTokenExpiry.getTime() <= new Date().getTime()))) {
            CCTokenRequestResult = ServiceFacade.ccTokenRequestServiceAWP(order, pi, preferences);
            if (!CCTokenRequestResult.error && CCTokenRequestResult.conflictMsg !== 'Conflict') {
                Transaction.wrap(function () {
                    PaymentInstrumentUtils.updatePaymentInstrumentToken(CCTokenRequestResult, pi);
                });
            } else if (CCTokenRequestResult.conflictMsg === 'Conflict') {
                var updateTokenExpiryDate = null;
                var updateTokenCcHolderName = null;
                var tokenServiceResponse = CCTokenRequestResult.serviceResponse;
                if (tokenServiceResponse) {
                    if (tokenServiceResponse.tokenConflictExpDate && tokenServiceResponse.tokenExpdateURL) {
                        Logger.getLogger('worldpay').debug('Update token service triggered for cardExpiryDate update');
                        updateTokenExpiryDate = ServiceFacade.updateToken(tokenServiceResponse.tokenConflictExpDate, tokenServiceResponse.tokenExpdateURL);
                    }
                    if (tokenServiceResponse.tokenConflictName && tokenServiceResponse.tokenCcHolderNameURL) {
                        Logger.getLogger('worldpay').debug('Update token service triggered for cardHolderName update');
                        updateTokenCcHolderName = ServiceFacade.updateToken(tokenServiceResponse.tokenConflictName, tokenServiceResponse.tokenCcHolderNameURL);
                    }
                }
                if ((updateTokenExpiryDate && updateTokenExpiryDate.success) || (updateTokenCcHolderName && updateTokenCcHolderName.success)) {
                    Transaction.wrap(function () {
                        if (!pi.custom.updateTokenResult) {
                            pi.custom.updateTokenResult = 'true';
                        }
                    });
                } else if ((updateTokenExpiryDate && updateTokenExpiryDate.error) || (updateTokenCcHolderName && updateTokenCcHolderName.error)) {
                    Logger.getLogger('worldpay').debug('Update token failed');
                    Transaction.wrap(function () {
                        if (!pi.custom.updateTokenResult) {
                            pi.custom.updateTokenResult = 'false';
                        }
                    });
                }
                Transaction.wrap(function () {
                    pi.custom.awpTokenConflict = 'Conflict';
                });
            }
        }
        customerObj = order.customer.authenticated ? order.customer : null;
        return TokenProcessUtils.checkAuthorizationAWP(serviceResponse, pi, customerObj, CCTokenRequestResult);
    }

    var authorizeOrderResult;
    if ((pi.paymentMethod.equals(PaymentInstrument.METHOD_CREDIT_CARD) && ccSecurityModel === 'WEB_SDK')) {
        if (preferences.threeDSType.value.equals('two3d') && !authentication3ds) {
            return createJWTToken(orderNumber);
        }
        authorizeOrderResult = ServiceFacade.webCSDKAuth(order, pi, preferences, authentication3ds);
        var serviceresponse = authorizeOrderResult.serviceresponse;
        if (serviceresponse) {
            setURLs(serviceresponse, order);
        }
        customerObj = order.customer.authenticated ? order.customer : null;
        if (customerObj && customerObj.authenticated) {
            return TokenProcessUtils.checkAuthorizationWCSDK(serviceresponse, pi, customerObj);// to be discussed
        }
        delete session.privacy.verfiedToken;
        delete session.privacy.conflictMsg;
        delete session.privacy.updateresult;
    }
    if (apmName.equals(WorldpayConstants.GOOGLEPAY)) {
        authorizeOrderResult = ServiceFacade.gpayServiceWrapper(order, pi, preferences);
    }
    if (authorizeOrderResult.error) {
        Logger.getLogger('worldpay').error('AuthorizeOrder.js : ErrorCode : ' + authorizeOrderResult.errorCode + ' : Error Message : ' + authorizeOrderResult.errorMessage);
        serverErrors.push(authorizeOrderResult.errorMessage);
        return { fieldErrors: fieldErrors, serverErrors: serverErrors, error: true, errorCode: authorizeOrderResult.errorCode, errorMessage: authorizeOrderResult.errorMessage };
    }
    var apmAuthserviceResponse = authorizeOrderResult.serviceresponse;
    if (apmAuthserviceResponse) {
        setURLs(apmAuthserviceResponse, order);
    }

    return {
        authorized: true
    };
}

/**
 * Creates an array of objects containing applicable payment methods
 * @param {dw.util.ArrayList<dw.order.dw.order.PaymentMethod>} paymentMethods - An ArrayList of
 *      applicable payment methods that the user could use for the current basket.
 * @param {string} countryCode - the associated apm countryCode
 * @param {Object} preferences - the associated worldpay preferences
 * @returns {Array} of object that contain information about the applicable payment methods for the
 *      current cart
 */
function applicablePaymentMethods() {
    var applicableAPMs = new ArrayList();
    // get page url action
    var pageaction;
    var req = request;
    var requestpath = req.getHttpPath();
    if (requestpath) {
        var action = requestpath.split('/');
        pageaction = action[action.length - 1];
    }
    if (pageaction !== 'Order-History') {
        var creditCardPmtMtd = PaymentMgr.getPaymentMethod(WorldpayConstants.CREDITCARD);
        if (creditCardPmtMtd != null && creditCardPmtMtd.active && creditCardPmtMtd.paymentProcessor && WorldpayConstants.WORLDPAY.equals(creditCardPmtMtd.paymentProcessor.ID)) {
            applicableAPMs.push(creditCardPmtMtd);
        }
        var googlePayPmtMthd = PaymentMgr.getPaymentMethod(WorldpayConstants.GOOGLEPAY);
        if (googlePayPmtMthd != null && googlePayPmtMthd.active && googlePayPmtMthd.paymentProcessor && WorldpayConstants.WORLDPAY.equals(googlePayPmtMthd.paymentProcessor.ID)) {
            applicableAPMs.push(googlePayPmtMthd);
        }
        var applePayWorldPay = PaymentMgr.getPaymentMethod(WorldpayConstants.APPLEPAY);
        if (applePayWorldPay != null && applePayWorldPay.active && applePayWorldPay.paymentProcessor && WorldpayConstants.WORLDPAY.equals(applePayWorldPay.paymentProcessor.ID)) {
            applicableAPMs.push(applePayWorldPay);
        }
    }
    return { applicableAPMs: applicableAPMs };
}

/**
 * create a verification request to 3ds to get challenge result
 * @param {dw.order.Order} orderObj - The current order object
 * @param {string} reference3ds -  reference number returned in authentication response
 * @return {Object} returns an error object
 */
function verification3ds(orderObj, reference3ds) {
    var orderNo = orderObj.orderNo;
    var WorldpayPreferences = require('*/cartridge/scripts/object/worldpayPreferences');
    var worldPayPreferences = new WorldpayPreferences();
    var preferences = worldPayPreferences.worldPayPreferencesInit();
    var serviceResponse = ServiceFacade.verificationRequest3ds(orderNo, preferences, reference3ds);
    if (serviceResponse.error) {
        return {
            error: true,
            errorCode: serviceResponse.errorCode,
            errorMessage: serviceResponse.errorMessage
        };
    }
    return {
        error: false,
        outcome: serviceResponse.serviceresponse.outcome,
        authentication3ds: serviceResponse.serviceresponse.authentication3ds
    };
}

/**
 * create a verification request to 3ds to get challenge result
 * @param {string} sessionID - The session Identifier(href) for webCSDK
 * @param {string} wsdkname -  reference name from webCSDK form
 * @param {Object} customer -  reference name from webCSDK form
 * @return {Object} returns an error object
 */
function getVerifiedToken(sessionID, wsdkname, customer) {
    var customerObject = '';
    var cardUpdateResult = '';
    var customerPaymentInstruments;
    var wallet;
    var Site = require('dw/system/Site');
    var isMagicValuesEnabled = Site.getCurrent().getCustomPreferenceValue('enableMagicValues');
    var cardHolderName = (isMagicValuesEnabled) ? wsdkname : wsdkname.toUpperCase();

    if (session.privacy.conflictMsg) {
        delete session.privacy.conflictMsg;
    }
    if (session.privacy.verfiedToken) {
        delete session.privacy.verfiedToken;
    }
    if (session.privacy.updateresult) {
        delete session.privacy.updateresult;
    }
    var CustomerMgr = require('dw/customer/CustomerMgr');
    if (customer) {
        customerObject = CustomerMgr.getCustomerByCustomerNumber(customer);
    }
    if (customerObject && customerObject.authenticated) {
        wallet = customerObject.getProfile().getWallet();
        customerPaymentInstruments = wallet.getPaymentInstruments(PaymentInstrument.METHOD_CREDIT_CARD);
    }
    var verifiedTokenResponse = ServiceFacade.ccVerifiedTokenRequestServiceAWP(sessionID, cardHolderName, customerObject);
    // delete any orphan token in session
    if (session.privacy.clearToken) {
        delete session.privacy.clearToken;
    }
    if (verifiedTokenResponse) {
        if (verifiedTokenResponse.error) {
            return {
                error: true,
                servererror: true
            };
        }
        var servcResponse = verifiedTokenResponse.serviceResponse;
        if (servcResponse) {
            if (servcResponse.outcome === 'not verified') {
                return {
                    error: true,
                    verified: 'not verified'
                };
            }
            if (servcResponse.outcome === 'verified') {
                session.privacy.verfiedToken = servcResponse.tokenUrl;
                // set the token in session to be used for the delete token flow
                session.privacy.clearToken = servcResponse.tokenUrl;
                var tokenConflictURL = servcResponse.tokenConflictUrl;
                var conflicts = PaymentInstrumentUtils.findConflicts(tokenConflictURL);
                var updateResult = PaymentInstrumentUtils.updateTokenConflictsWCsdk(conflicts);
                Transaction.begin();
                if (customerPaymentInstruments) {
                    var matchedPaymentInstrument = PaymentInstrumentUtils.getTokenPaymentInstrument(customerPaymentInstruments, servcResponse);
                    if (matchedPaymentInstrument) {
                        // authenticated user with saved card, no need to delete the token.
                        delete session.privacy.clearToken;
                        if (conflicts.length > 0) {
                            // if the card is present in account and has token conflict
                            if (updateResult.length === conflicts.length) {
                                Transaction.wrap(function () {
                                    wallet.removePaymentInstrument(matchedPaymentInstrument);
                                });
                                cardHolderName = matchedPaymentInstrument.getCreditCardHolder();
                                var cardExpiryMonth = matchedPaymentInstrument.getCreditCardExpirationMonth();
                                var cardExpiryYear = matchedPaymentInstrument.getCreditCardExpirationYear();
                                conflicts.forEach(function (conflictObj) {
                                    if (conflictObj.conflict === 'cardHolder') {
                                        cardHolderName = isMagicValuesEnabled ? conflictObj.cardHolder : wsdkname;
                                    } else if (conflictObj.conflict === 'expDate') {
                                        cardExpiryMonth = conflictObj.expDate.month;
                                        cardExpiryYear = conflictObj.expDate.year;
                                    }
                                });
                                try {
                                    var paymentInstrument;
                                    paymentInstrument = wallet.createPaymentInstrument('CREDIT_CARD');
                                    paymentInstrument.setCreditCardHolder(cardHolderName);
                                    paymentInstrument.setCreditCardNumber(matchedPaymentInstrument.creditCardNumber);
                                    paymentInstrument.setCreditCardType(matchedPaymentInstrument.creditCardType);
                                    paymentInstrument.setCreditCardExpirationMonth(cardExpiryMonth);
                                    paymentInstrument.setCreditCardExpirationYear(cardExpiryYear);
                                    paymentInstrument.custom.awpCCTokenData = servcResponse.tokenUrl;
                                    paymentInstrument.setCreditCardToken(matchedPaymentInstrument.creditCardToken);
                                    Transaction.commit();
                                    session.privacy.updateresult = 'true';
                                    session.privacy.conflictMsg = verifiedTokenResponse.conflictMsg;
                                    cardUpdateResult = true;
                                } catch (tokenUpdateException) {
                                    Logger.debug('Exception occured while resolving token conflicts' + tokenUpdateException.message);
                                    Transaction.rollback();
                                    return {
                                        error: true,
                                        cardUpdateResult: cardUpdateResult
                                    };
                                }
                            } else {
                                Logger.debug('Update token failed');
                                Transaction.rollback();
                                return {
                                    error: true,
                                    updateLimitCrossed: true
                                };
                            }
                        } else {
                            // if the card is present in account and user tries to add again
                            return {
                                error: false,
                                cardExists: true
                            };
                        }
                    }
                }
                return {
                    error: false,
                    cardUpdateResult: cardUpdateResult
                };
            }
        }
    }
    return {
        error: true,
        servererror: true
    };
}

/**
 * Verifies selected payment with their form fields information is valid or not.
 * If the information is valid payment instrument is created.
 * @param {dw.order.Basket} basket - Current users's basket
 * @param {Object} paymentInformation - the payment information
 * @return {Object} returns an error object
 */
function handleWebSdk(basket, paymentInformation) {
    var currentBasket = basket;
    var worldPayCardType; var conflictMsg; var updateTokenResult;
    var WorldpayPreferences = require('*/cartridge/scripts/object/worldpayPreferences');
    var worldPayPreferences = new WorldpayPreferences();
    var preferences = worldPayPreferences.worldPayPreferencesInit();
    var EnableTokenizationPref = preferences.EnableCCTokenization;
    if (session.privacy.conflictMsg) {
        conflictMsg = session.privacy.conflictMsg;
    }
    if (session.privacy.updateresult) {
        updateTokenResult = session.privacy.updateresult;
    }
    var paymentInstrument;
    var fieldErrors = {};
    var serverErrors = [];

    Transaction.wrap(function () {
        PaymentInstrumentUtils.removeExistingPaymentInstruments(currentBasket);

        paymentInstrument = currentBasket.createPaymentInstrument(
            PaymentInstrument.METHOD_CREDIT_CARD, paymentInformation.paymentPrice
        );
        var cardNumber = paymentInformation.cardNumber.value;
        var expirationMonth = paymentInformation.expirationMonth.value;
        var expirationYear = paymentInformation.expirationYear.value;
        var holderName = paymentInformation.cardOwner.value;
        var cardType = paymentInformation.cardType.value;
        if (!paymentInformation.creditCardToken) {
            worldPayCardType = CardHelper.getCardType(cardType);
            paymentInstrument.setCreditCardType(worldPayCardType);
        } else {
            paymentInstrument.setCreditCardType(cardType);
        }
        paymentInstrument.setCreditCardHolder(holderName);
        paymentInstrument.setCreditCardNumber(cardNumber);
        paymentInstrument.setCreditCardExpirationMonth(expirationMonth);
        paymentInstrument.setCreditCardExpirationYear(expirationYear);
        if (!empty(paymentInformation.creditCardTokenData)) {
            paymentInstrument.custom.awpCCTokenData = paymentInformation.creditCardTokenData;
        } else if (paymentInformation.saveCard && paymentInformation.saveCard.value && EnableTokenizationPref) {
            paymentInstrument.custom.wpTokenRequested = true;
        }
        if (!paymentInstrument.custom.awpCCTokenData) {
            paymentInstrument.custom.awpCCTokenData = paymentInformation.tokenPI.value;
        }
        if (!paymentInstrument.custom.awpTokenConflict) {
            paymentInstrument.custom.awpTokenConflict = conflictMsg;
        }
        if (!paymentInstrument.custom.updateTokenResult) {
            paymentInstrument.custom.updateTokenResult = updateTokenResult;
        }

        if (paymentInformation.saveCard && paymentInformation.saveCard.value && EnableTokenizationPref) {
            paymentInstrument.custom.wpTokenRequested = true;
        }

        paymentInstrument.custom.csdkTokenId = paymentInformation.tokenID.value;
        paymentInstrument.custom.csdkTokenExp = paymentInformation.tokenExp.value;
        paymentInstrument.custom.csdkTokenPi = paymentInformation.tokenPI.value;
    });
    return { fieldErrors: fieldErrors, serverErrors: serverErrors, error: false, success: true };
}

/**
 * Enquire the token to get details so that card with verified token can be
 * saved
 * @return {Object} returns an error object
 */
function enquireToken() {
    if (session.privacy.verfiedToken) {
        var enquireServiceResult = ServiceFacade.enquireToken(session.privacy.verfiedToken);
        return {
            enquireServiceResult: enquireServiceResult,
            error: false,
            success: true
        };
    }
    return {
        error: true
    };
}

module.exports = {
    updateToken: updateToken,
    handleCreditCardAWP: handleCreditCardAWP,
    setURLs: setURLs,
    authorizeAWP: authorizeAWP,
    authenticate3ds: authenticate3ds,
    applicablePaymentMethods: applicablePaymentMethods,
    createJWTToken: createJWTToken,
    handleAPM: handleAPM,
    verification3ds: verification3ds,
    getVerifiedToken: getVerifiedToken,
    handleWebSdk: handleWebSdk,
    enquireToken: enquireToken
};
