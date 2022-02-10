'use strict';

var ArrayList = require('dw/util/ArrayList');
var Logger = require('dw/system/Logger');
var PaymentInstrument = require('dw/order/PaymentInstrument');
var paymentInstrumentUtils = require('*/cartridge/scripts/common/paymentInstrumentUtils');
var PaymentMgr = require('dw/order/PaymentMgr');
var Transaction = require('dw/system/Transaction');
var worldpayConstants = require('*/cartridge/scripts/common/worldpayConstants');
var serviceFacade = require('*/cartridge/scripts/service/serviceFacade');
var cardHelper = require('*/cartridge/scripts/common/cardHelper');

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
            CCTokenRequestResult = serviceFacade.ccIntelligentTokenRequestServiceAWP(paymentInstrument, preferences, customer);
            var serviceResponse = CCTokenRequestResult.serviceResponse;

            if (!CCTokenRequestResult.error) {
                var result = paymentInstrumentUtils.validateTokenServiceResponse(CCTokenRequestResult, paymentInstrument);
                var matchedPaymentInstrument = paymentInstrumentUtils.getTokenPaymentInstrument(customerPaymentInstruments, serviceResponse);
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
        paymentInstrumentUtils.removeExistingPaymentInstruments(currentBasket);

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
        } else if (paymentInformation.saveCard && paymentInformation.saveCard.value && EnableTokenizationPref) {
            paymentInstrument.custom.wpTokenRequested = true;
        }
        if (paymentInformation.creditCardTokenExpiry) {
            paymentInstrument.custom.awpCCTokenExpiry = paymentInformation.creditCardTokenExpiry;
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
 * @param {string} orderNumber - current order number
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
                if (payProcessor != null && payProcessor.getID().equalsIgnoreCase(worldpayConstants.WORLDPAY)) {
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
    var JWTTokenRequestResult = serviceFacade.jwtTokenRequest(order, pi, preferences);
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
        paymentInstrumentUtils.removeExistingPaymentInstruments(basket);
        paymentInstrument = basket.createPaymentInstrument(
            paymentMethod, paymentInformation.paymentPrice
        );
        if (paymentMethod.equals(worldpayConstants.GOOGLEPAY)) {
            paymentInstrument.custom.gpayToken = paramMap.gpaytoken;
        } else if (paymentMethod.equals(worldpayConstants.ACHPAY)) {
            let achFields = paymentInformation.achFields;
            paymentInstrument.custom.achAccountType = achFields.achAccountType.value;
            paymentInstrument.setBankAccountNumber(achFields.achAccountNumber.value);
            paymentInstrument.setBankRoutingNumber(achFields.achRoutingNumber.value);
            paymentInstrument.custom.achCheckNumber = achFields.achCheckNumber.value;
            paymentInstrument.custom.achCompanyName = achFields.achCompanyName.value;
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
    if (serviceResponse) {
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
}

/**
 * Exemption Engine validation for order. Based on the Exemption outcome and placement type, exemption order assessment takes place.
 * logic to check Order Exemption Engine
 * @param {string} orderNumber - Order object
 * @param {Object} pi - Payment Instrument
 * @param {Oject} preferences - Worldpay Preferences
 * @returns {Object} Exemption response
 */
function orderExemptionValidation(orderNumber, pi, preferences) {
    var OrderMgr = require('dw/order/OrderMgr');
    var order = OrderMgr.getOrder(orderNumber);
    var authenticationRequired = false;
    var exemptionEngineResult = serviceFacade.validateOrderExemption(order, pi, preferences);
    if (exemptionEngineResult.error) {
        return {
            error: true,
            exemptionEngineResult: exemptionEngineResult
        };
    }
    var exemptionResponse = exemptionEngineResult.serviceresponse;
    Transaction.begin();
    order.custom.isExemptionRequested = true;
    Transaction.commit();
    if (preferences.threeDSType.value.equals('two3d') && (exemptionResponse.outcome === 'noExemption' || exemptionResponse.exemption.placement === 'authentication')) {
        authenticationRequired = true;
    }
    session.privacy.riskProfile = exemptionResponse.riskProfile.href;
    return {
        error: false,
        exemptionResponse: exemptionResponse,
        authenticationRequired: authenticationRequired
    };
}

/**
 * Enquire the token to get details so that card with verified token can be
 * saved
 * @return {Object} returns an error object
 */
function enquireToken() {
    if (session.privacy.verfiedToken) {
        var enquireServiceResult = serviceFacade.enquireToken(session.privacy.verfiedToken);
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

/**
 * Adds transactionID and paymentProcessor to payment instrument and returns it
 * @param {number} orderNumber - The current order's number
 * @returns {Object} returns updated payment instrument
 */
function getOrderPaymentInstrument(orderNumber) {
    var OrderMgr = require('dw/order/OrderMgr');
    var order = OrderMgr.getOrder(orderNumber);
    var pi;
    var paymentInstruments = order.getPaymentInstruments();
    if (paymentInstruments.length > 0) {
        Transaction.wrap(function () {
            for (var i = 0; i < paymentInstruments.length; i++) {
                pi = paymentInstruments[i];
                var payProcessor = PaymentMgr.getPaymentMethod(pi.getPaymentMethod()).getPaymentProcessor();
                if (payProcessor != null && payProcessor.getID().equalsIgnoreCase(worldpayConstants.WORLDPAY)) {
                    // update payment instrument with transaction basic attributes
                    pi.paymentTransaction.transactionID = orderNumber;
                    pi.paymentTransaction.paymentProcessor = payProcessor;
                    break;
                }
            }
        });
    }
    return pi;
}

/**
 * deletes verified token, clear token and conflict url from session
 */
function deleteTokens() {
    if (session.privacy.conflictUrl) {
        delete session.privacy.conflictUrl;
    }
    if (session.privacy.verfiedToken) {
        delete session.privacy.verfiedToken;
    }
    if (session.privacy.clearToken) {
        delete session.privacy.clearToken;
    }
}

/**
 * This function logs any kind of error in direct or websdk flow and returns an error object
 * @param {string} errorCode - contains errorCode to be returned
 * @param {string} errorMessageKey - contains key to construct error message
 * @param {string} bundleName - contains bundle name to construct error message
 * @param {string} loggerKey - contains string to log error
 * @returns {Object} - error object
 */
function getErrorMessage(errorCode, errorMessageKey, bundleName, loggerKey) {
    var utils = require('*/cartridge/scripts/common/utils');
    var serverErrors = [];
    var fieldErrors = {};
    let errorMessage = utils.getConfiguredLabel(errorMessageKey, bundleName);
    Logger.getLogger('worldpay').error(loggerKey + ' : Error Message : ' + errorMessage);
    serverErrors.push(errorMessage);
    return {
        fieldErrors: fieldErrors,
        serverErrors: serverErrors,
        error: true,
        errorCode: errorCode,
        errorMessage: errorMessage
    };
}

/**
 * This function resolves conflicts and updates the current payment instrument
 * @param {Object} paymentInstrument - contains current payment object
 * @param {Object} enquireServiceResult - contains response of enquire token
 * @returns {Object} - returns updated payment object
 */
function resolveConflictsDirectHelper(paymentInstrument, enquireServiceResult) {
    var pi = paymentInstrument;
    var conflictResolutionResponse = null;
    var tokenConflictURL = session.privacy.conflictUrl;
    var tokenServiceResponse = enquireServiceResult.serviceresponse;
    if (tokenServiceResponse) {
        Logger.getLogger('worldpay').debug('Update token service triggered for Conflict update');
        conflictResolutionResponse = serviceFacade.updateTokenDetails(tokenConflictURL);
    }
    if (conflictResolutionResponse && conflictResolutionResponse.success) {
        Transaction.wrap(function () {
            if (!pi.custom.updateTokenResult) {
                pi.custom.updateTokenResult = 'true';
            }
        });
    } else {
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
    return pi;
}

/**
 * Resolves conflicts and returns an object
 * @param {boolean} saveCardInConflict - Flag to check conflict in saved card
 * @param {Object} preferences - The current preference
 * @param {Object} paymentInstrument - The current payment instrument object
 * @param {boolean} conflictMsg - Flag to check if there are any conflicts
 * @returns {Object} returns an object
 */
function resolveConflictsDirect(saveCardInConflict, preferences, paymentInstrument, conflictMsg) {
    // save token details in order object
    var pi = paymentInstrument;
    var enquireServiceResult = null;
    if (preferences.EnableCCTokenization && customer.authenticated && (pi.custom.awpCCTokenData || pi.custom.wpTokenRequested || saveCardInConflict ||
            (pi.custom.awpCCTokenExpiry && pi.custom.awpCCTokenExpiry.getTime() >= new Date().getTime()))) {
        if (conflictMsg) {
            session.privacy.verfiedToken = session.privacy.conflictUrl;
        }
        var CCTokenRequestResult = enquireToken();
        enquireServiceResult = CCTokenRequestResult.enquireServiceResult;
        if (!CCTokenRequestResult.error && !conflictMsg) {
            Transaction.wrap(function () {
                paymentInstrumentUtils.updatePaymentInstrumentToken(enquireServiceResult, pi);
            });
        } else if (conflictMsg) {
            pi = resolveConflictsDirectHelper(pi, enquireServiceResult);
        }
        deleteTokens();
    }
    return {
        pi: pi,
        enquireServiceResult: enquireServiceResult
    };
}

/**
 * Makes serviceFacade call for verified tokens
 * @param {Object} order - The current order object
 * @param {string} cvn - card cvn
 * @param {Object} pi - The current payment instrument object
 * @returns {Object} returns object containing updated values of saveCardInConflict and conflictMsg
 */
function generateDirectCCToken(order, cvn, pi) {
    var Site = require('dw/system/Site');
    var saveCardInConflict = false;
    var conflictMsg = false;
    var customerObject = order.customer.authenticated ? order.customer : null;
    var isMagicValuesEnabled = Site.getCurrent().getCustomPreferenceValue('enableMagicValues');
    var cardHolderName = (isMagicValuesEnabled) ? pi.creditCardHolder : pi.creditCardHolder.toUpperCase();
    var verifiedTokenResponse = serviceFacade.ccVerifiedTokenRequestServiceAWPDirect(cardHolderName, customerObject, cvn, pi);
    if (verifiedTokenResponse.error) {
        // Add error scenario and return to summary page
        let errorMessageKey = 'worldpay.error.code' + verifiedTokenResponse.errorCode;
        if (verifiedTokenResponse.errorCode === 'ERROR' && pi.isPermanentlyMasked()) {
            errorMessageKey = 'worldpay.error.code.3dsfailed';
        }
        return getErrorMessage(verifiedTokenResponse.errorCode, errorMessageKey, 'worldpayError',
            'Worldpay Payment verifiedTokenResponse : ErrorCode : ' + verifiedTokenResponse.errorCode);
    }
    var verifiedTokenServiceResponse = verifiedTokenResponse.serviceResponse;
    if (verifiedTokenServiceResponse) {
        if (verifiedTokenServiceResponse.outcome === 'not verified') {
            return getErrorMessage(null,
                'websdk.notoken.error', 'worldpay',
                'Worldpay Payment verifiedTokenServiceResponse');
        }
        if (verifiedTokenServiceResponse.outcome === 'verified') {
            session.privacy.verfiedToken = verifiedTokenServiceResponse.tokenUrl;
            // set the token in session to be used for the delete token flow
            session.privacy.clearToken = verifiedTokenServiceResponse.tokenUrl;
            if (verifiedTokenServiceResponse.tokenConflictUrl) {
                session.privacy.conflictUrl = verifiedTokenServiceResponse.tokenConflictUrl;
                conflictMsg = true;
            }
            if (conflictMsg && !pi.custom.wpTokenRequested && customerObject) {
                var wallet = customerObject.getProfile().getWallet();
                var customerPaymentInstruments = wallet.getPaymentInstruments(PaymentInstrument.METHOD_CREDIT_CARD);
                var matchedPaymentInstrument = null;
                if (customerPaymentInstruments) {
                    matchedPaymentInstrument = paymentInstrumentUtils.getTokenPaymentInstrument(customerPaymentInstruments, verifiedTokenServiceResponse);
                }
                if (matchedPaymentInstrument) {
                    saveCardInConflict = true;
                }
            }
        }
    }
    return {
        saveCardInConflict: saveCardInConflict,
        conflictMsg: conflictMsg
    };
}

/**
 * Authorizes a payment using a credit card direct
 * @param {Object} preferences - The current preference
 * @param {Object} paymentInstrument - The current payment instrument object
 * @param {number} orderNumber - The current order's number
 * @param {string} cvn - card cvn
 * @param {Object} authentication3ds - 3ds authentication data
 * @param {string} orderType - orderType eg. moto
 * @return {Object} returns an TokenProcessUtils object or error object
 */
function directHelper(preferences, paymentInstrument, orderNumber, cvn, authentication3ds, orderType) {
    var Site = require('dw/system/Site');
    var OrderMgr = require('dw/order/OrderMgr');
    var TokenProcessUtils = require('*/cartridge/scripts/common/tokenProcessUtils');
    var exemptionEngineEnabled = Site.getCurrent().getCustomPreferenceValue('isExemptionEngineEnabled');
    var pi = paymentInstrument;
    var conflictMsg = false;
    var order = OrderMgr.getOrder(orderNumber);
    var authenticationData3ds = authentication3ds;
    var orderExemptionResponse;
    var enquireServiceResult;
    deleteTokens();
    var saveCardInConflict = false;
    if (preferences.EnableCCTokenization) {
        if (pi.custom.awpCCTokenData) {
            session.privacy.verfiedToken = pi.custom.awpCCTokenData;
        } else {
            var result = generateDirectCCToken(order, cvn, pi);
            saveCardInConflict = result.saveCardInConflict;
            conflictMsg = result.conflictMsg;
        }
    }

    var conflictsResponse = resolveConflictsDirect(saveCardInConflict, preferences, pi, conflictMsg);
    pi = conflictsResponse.pi;
    enquireServiceResult = conflictsResponse.enquireServiceResult;
    if (exemptionEngineEnabled && order.custom.isExemptionRequested === false) {
        orderExemptionResponse = orderExemptionValidation(orderNumber, pi, preferences);
        if (orderExemptionResponse.error) {
            return getErrorMessage(orderExemptionResponse.exemptionEngineResult.errorCode,
                'worldpay.error.exemptionERROR', 'worldpayError',
                'Worldpay Payment orderExemptionResponse : ErrorCode : ' + orderExemptionResponse.exemptionEngineResult.errorCode);
        }
    }
    if (preferences.threeDSType.value.equals('two3d') && !authentication3ds && orderType !== worldpayConstants.MOTO_ORDER) {
        if (!exemptionEngineEnabled || (exemptionEngineEnabled && orderExemptionResponse && orderExemptionResponse.authenticationRequired)) {
            return createJWTToken(orderNumber);
        }
    }
    // Auth service call
    var CCAuthorizeRequestResult = serviceFacade.ccAuthorizeRequestServiceAWP(order, cvn, pi, preferences, authenticationData3ds);
    if (CCAuthorizeRequestResult.error) {
        return getErrorMessage(CCAuthorizeRequestResult.errorCode,
            'worldpay.error.code' + CCAuthorizeRequestResult.errorCode, 'worldpayError',
            'Worldpay Payment SendCCAuthorizeRequest : ErrorCode : ' + CCAuthorizeRequestResult.errorCode);
    }
    var serviceResponse = CCAuthorizeRequestResult.serviceresponse;
    setURLs(serviceResponse, order);

    var customerObj = order.customer.authenticated ? order.customer : null;
    return TokenProcessUtils.checkAuthorizationAWP(serviceResponse, pi, customerObj, enquireServiceResult, saveCardInConflict, preferences);
}

/**
 * Authorizes a payment using a credit card WebSDK
 * @param {Object} preferences - The current preference
 * @param {Object} pi - The current payment instrument object
 * @param {number} orderNumber - The current order's number
 * @param {Object} authentication3ds - 3ds authentication data
 * @return {Object} returns an error object or success object
 */
function webSDKHelper(preferences, pi, orderNumber, authentication3ds) {
    var Site = require('dw/system/Site');
    var OrderMgr = require('dw/order/OrderMgr');
    var TokenProcessUtils = require('*/cartridge/scripts/common/tokenProcessUtils');
    var order = OrderMgr.getOrder(orderNumber);
    var exemptionEngineEnabled = Site.getCurrent().getCustomPreferenceValue('isExemptionEngineEnabled');
    var authorizeOrderResult;
    var orderExemptionResponse = {};
    if (exemptionEngineEnabled && order.custom.isExemptionRequested === false) {
        orderExemptionResponse = orderExemptionValidation(orderNumber, pi, preferences);
        if (orderExemptionResponse.error) {
            return getErrorMessage(orderExemptionResponse.exemptionEngineResult.errorCode,
                'worldpay.error.exemptionERROR', 'worldpayError',
                'Worldpay Payment orderExemptionResponse : ErrorCode : ' + orderExemptionResponse.exemptionEngineResult.errorCode);
        }
    }
    if (preferences.threeDSType.value.equals('two3d') && !authentication3ds) {
        if (!exemptionEngineEnabled || (exemptionEngineEnabled && orderExemptionResponse && orderExemptionResponse.authenticationRequired)) {
            return createJWTToken(orderNumber);
        }
    }
    var isCVVDisabled = Site.getCurrent().getCustomPreferenceValue('isAWPCvvDisabled');
    if (!isCVVDisabled && session.privacy.cvvSessionHref) {
        authorizeOrderResult = serviceFacade.webCSDKCVVCheckoutAuth(order, pi, preferences, authentication3ds);
    } else {
        authorizeOrderResult = serviceFacade.webCSDKAuth(order, pi, preferences, authentication3ds);
    }
    if (authorizeOrderResult.error) {
        return getErrorMessage(authorizeOrderResult.errorCode,
            'worldpay.error.code' + authorizeOrderResult.errorCode, 'worldpayError',
            'Worldpay Payment AuthorizeOrder.js : ErrorCode : ' + authorizeOrderResult.errorCode);
    }
    var serviceresponse = authorizeOrderResult.serviceresponse;
    setURLs(serviceresponse, order);
    var customerObj = order.customer.authenticated ? order.customer : null;
    if (customerObj && customerObj.authenticated) {
        return TokenProcessUtils.checkAuthorizationWCSDK(serviceresponse, pi, customerObj); // to be discussed
    }
    delete session.privacy.verfiedToken;
    delete session.privacy.conflictMsg;
    delete session.privacy.updateresult;
    return {
        authorized: true
    };
}

/**
 * Authorizes a payment using GPay.
 * @param {Object} order - The current order object
 * @param {Object} preferences - The current preference
 * @param {Object} pi - The current payment instrument object
 * @return {Object} returns success or error object
 */
function gpayHelper(order, preferences, pi) {
    var authorizeOrderResult = serviceFacade.gpayServiceWrapper(order, pi, preferences);
    return authorizeOrderResult;
}

/**
 * Authorizes a payment using a credit card direct
 * @param {number} orderNumber - The current order's number
 * @param {string} cvn - card cvn
 * @param {Object} authentication3ds - 3ds authentication data
 * @param {string} orderType - orderType eg. moto
 * @return {Object} returns success or error object
 */
function initiateDirectAuthorization(orderNumber, cvn, authentication3ds, orderType) {
    var OrderMgr = require('dw/order/OrderMgr');
    var WorldpayPreferences = require('*/cartridge/scripts/object/worldpayPreferences');
    var Resource = require('dw/web/Resource');
    // fetch order object
    var order = OrderMgr.getOrder(orderNumber);
    // initialize worldpay preferences
    var worldPayPreferences = new WorldpayPreferences();
    if (!order) {
        var serverErrors = [];
        Logger.getLogger('worldpay').error('authorize : Invalid Order');
        serverErrors.push(Resource.msg('error.technical', 'checkout', null));
        return { fieldErrors: {}, serverErrors: serverErrors, error: true };
    }
    var pi = getOrderPaymentInstrument(orderNumber);
    var apmName = pi.getPaymentMethod();
    var paymentMthd = PaymentMgr.getPaymentMethod(apmName);
    var preferences = worldPayPreferences.worldPayPreferencesInit(paymentMthd);
    return directHelper(preferences, pi, orderNumber, cvn, authentication3ds, orderType);
}

/**
 * Authorizes a payment using a credit card WebSDK
 * @param {number} orderNumber - The current order's number
 * @param {number} cvn - The current order's cvn number
 * @param {Object} authentication3ds - 3ds authentication data
 * @return {Object} returns an error object or success object
 */
function initiateWebSDKAuthorization(orderNumber, cvn, authentication3ds) {
    var OrderMgr = require('dw/order/OrderMgr');
    var WorldpayPreferences = require('*/cartridge/scripts/object/worldpayPreferences');
    var Resource = require('dw/web/Resource');
    // fetch order object
    var order = OrderMgr.getOrder(orderNumber);
    // initialize worldpay preferences
    var worldPayPreferences = new WorldpayPreferences();
    if (!order) {
        var serverErrors = [];
        Logger.getLogger('worldpay').error('authorize : Invalid Order');
        serverErrors.push(Resource.msg('error.technical', 'checkout', null));
        return { fieldErrors: {}, serverErrors: serverErrors, error: true };
    }
    var pi = getOrderPaymentInstrument(orderNumber);
    var apmName = pi.getPaymentMethod();
    var paymentMthd = PaymentMgr.getPaymentMethod(apmName);
    var preferences = worldPayPreferences.worldPayPreferencesInit(paymentMthd);
    return webSDKHelper(preferences, pi, orderNumber, authentication3ds);
}

/**
 * Authorizes a payment using GPay.
 * @param {number} orderNumber - The current order's number
 * @param {string} cvn - card cvn
 * @param {Object} authentication3ds - 3ds authentication data
 * @return {Object} returns success or error object
 */
function initiateGPayAuthorization(orderNumber) {
    var OrderMgr = require('dw/order/OrderMgr');
    var WorldpayPreferences = require('*/cartridge/scripts/object/worldpayPreferences');
    var Resource = require('dw/web/Resource');
    // fetch order object
    var order = OrderMgr.getOrder(orderNumber);
    // initialize worldpay preferences
    var worldPayPreferences = new WorldpayPreferences();
    if (!order) {
        var serverErrors = [];
        Logger.getLogger('worldpay').error('authorize : Invalid Order');
        serverErrors.push(Resource.msg('error.technical', 'checkout', null));
        return { fieldErrors: {}, serverErrors: serverErrors, error: true };
    }
    var pi = getOrderPaymentInstrument(orderNumber);
    var apmName = pi.getPaymentMethod();
    var paymentMthd = PaymentMgr.getPaymentMethod(apmName);
    var preferences = worldPayPreferences.worldPayPreferencesInit(paymentMthd);
    var authorizeOrderResult = gpayHelper(order, preferences, pi);
    if (authorizeOrderResult.error) {
        return getErrorMessage(authorizeOrderResult.errorCode,
            'worldpay.error.code' + authorizeOrderResult.errorCode, 'worldpayError',
            'Worldpay Payment AuthorizeOrder.js : ErrorCode : ' + authorizeOrderResult.errorCode);
    }
    setURLs(authorizeOrderResult.serviceresponse, order);
    return {
        authorized: true
    };
}

/**
 * Authorizes a payment using ACH Pay.
 * @param {number} orderNumber - The current order's number
 * @return {Object} returns success or error object
 */
function initiateAchPayAuthorization(orderNumber) {
    var OrderMgr = require('dw/order/OrderMgr');
    var WorldpayPreferences = require('*/cartridge/scripts/object/worldpayPreferences');
    var Resource = require('dw/web/Resource');
    var order = OrderMgr.getOrder(orderNumber);
    var worldPayPreferences = new WorldpayPreferences();
    if (!order) {
        var serverErrors = [];
        Logger.getLogger('worldpay').error('ACHPay authorize : Invalid Order');
        serverErrors.push(Resource.msg('error.technical', 'checkout', null));
        return { fieldErrors: {}, serverErrors: serverErrors, error: true };
    }
    var pi = getOrderPaymentInstrument(orderNumber);
    var apmName = pi.getPaymentMethod();
    var paymentMthd = PaymentMgr.getPaymentMethod(apmName);
    var preferences = worldPayPreferences.worldPayPreferencesInit(paymentMthd);
    var authorizeOrderResult = serviceFacade.achpayServiceWrapper(order, pi, preferences);
    if (authorizeOrderResult.error) {
        return getErrorMessage(authorizeOrderResult.errorCode, 'worldpay.error.code' + authorizeOrderResult.errorCode, 'worldpayError', 'Worldpay Payment ACH Pay : ErrorCode : ' + authorizeOrderResult.errorCode);
    }
    if (authorizeOrderResult && authorizeOrderResult.success && authorizeOrderResult.serviceresponse && !authorizeOrderResult.serviceresponse.error && authorizeOrderResult.serviceresponse.outcome.toString() !== worldpayConstants.REFUSED) {
        setURLs(authorizeOrderResult.serviceresponse, order);
        Transaction.begin();
        order.custom.achpayVoidSaleUrl = authorizeOrderResult.serviceresponse.directReversal;
        order.custom.achpayEventsUrl = authorizeOrderResult.serviceresponse.directEvents;
        order.custom.usDomesticOrder = true;
        order.custom.WorldpayLastEvent = authorizeOrderResult.serviceresponse.outcome;
        order.custom.oms_worldpay__awpRefundUrl = authorizeOrderResult.serviceresponse.directReversal;
        Transaction.commit();
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
        var creditCardPmtMtd = PaymentMgr.getPaymentMethod(worldpayConstants.CREDITCARD);
        if (creditCardPmtMtd != null && creditCardPmtMtd.active && creditCardPmtMtd.paymentProcessor && worldpayConstants.WORLDPAY.equals(creditCardPmtMtd.paymentProcessor.ID)) {
            applicableAPMs.push(creditCardPmtMtd);
        }
        var googlePayPmtMthd = PaymentMgr.getPaymentMethod(worldpayConstants.GOOGLEPAY);
        if (googlePayPmtMthd != null && googlePayPmtMthd.active && googlePayPmtMthd.paymentProcessor && worldpayConstants.WORLDPAY.equals(googlePayPmtMthd.paymentProcessor.ID)) {
            applicableAPMs.push(googlePayPmtMthd);
        }
        var applePayWorldPay = PaymentMgr.getPaymentMethod(worldpayConstants.APPLEPAY);
        if (applePayWorldPay != null && applePayWorldPay.active && applePayWorldPay.paymentProcessor && worldpayConstants.WORLDPAY.equals(applePayWorldPay.paymentProcessor.ID)) {
            applicableAPMs.push(applePayWorldPay);
        }
        var achPayPmtMthd = PaymentMgr.getPaymentMethod(worldpayConstants.ACHPAY);
        if (achPayPmtMthd != null && achPayPmtMthd.active && achPayPmtMthd.paymentProcessor && worldpayConstants.WORLDPAY.equals(achPayPmtMthd.paymentProcessor.ID)) {
            applicableAPMs.push(achPayPmtMthd);
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
    var serviceResponse = serviceFacade.verificationRequest3ds(orderNo, preferences, reference3ds);
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
    var verifiedTokenResponse = serviceFacade.ccVerifiedTokenRequestServiceAWP(sessionID, cardHolderName, customerObject);
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
                var conflicts = paymentInstrumentUtils.findConflicts(tokenConflictURL);
                var updateResult = paymentInstrumentUtils.updateTokenConflictsWCsdk(conflicts, tokenConflictURL);
                Transaction.begin();
                if (customerPaymentInstruments) {
                    var matchedPaymentInstrument = paymentInstrumentUtils.getTokenPaymentInstrument(customerPaymentInstruments, servcResponse);
                    if (matchedPaymentInstrument) {
                        // authenticated user with saved card, no need to delete the token.
                        Logger.getLogger('worldpay').debug('found duplicate card hence deleting the session attribute');
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
                            Logger.debug('the card is present in account and user tried to add again');
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
        paymentInstrumentUtils.removeExistingPaymentInstruments(currentBasket);

        paymentInstrument = currentBasket.createPaymentInstrument(
            PaymentInstrument.METHOD_CREDIT_CARD, paymentInformation.paymentPrice
        );
        var cardNumber = paymentInformation.cardNumber.value;
        var expirationMonth = paymentInformation.expirationMonth.value;
        var expirationYear = paymentInformation.expirationYear.value;
        var holderName = paymentInformation.cardOwner.value;
        var cardType = paymentInformation.cardType.value;
        if (!paymentInformation.creditCardToken) {
            worldPayCardType = cardHelper.getCardType(cardType);
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

        paymentInstrument.custom.csdkTokenId = paymentInformation.tokenID.value;
        paymentInstrument.custom.csdkTokenExp = paymentInformation.tokenExp.value;
        paymentInstrument.custom.csdkTokenPi = paymentInformation.tokenPI.value;
    });
    return { fieldErrors: fieldErrors, serverErrors: serverErrors, error: false, success: true };
}

module.exports = {
    updateToken: updateToken,
    handleCreditCardAWP: handleCreditCardAWP,
    setURLs: setURLs,
    initiateWebSDKAuthorization: initiateWebSDKAuthorization,
    initiateDirectAuthorization: initiateDirectAuthorization,
    initiateGPayAuthorization: initiateGPayAuthorization,
    authenticate3ds: authenticate3ds,
    applicablePaymentMethods: applicablePaymentMethods,
    createJWTToken: createJWTToken,
    handleAPM: handleAPM,
    verification3ds: verification3ds,
    getVerifiedToken: getVerifiedToken,
    handleWebSdk: handleWebSdk,
    enquireToken: enquireToken,
    orderExemptionValidation: orderExemptionValidation,
    initiateAchPayAuthorization: initiateAchPayAuthorization
};

