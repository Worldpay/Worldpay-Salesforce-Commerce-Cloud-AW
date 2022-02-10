/**
* This Method describes all constants used in worldpay
*/
function WorldpayConstants() { }
WorldpayConstants.UNKNOWN_ENTITY = 'UNKNOWN_IDENTITY';
WorldpayConstants.CANCELLEDBYSHOPPER = 'CANCELLED_BY_SHOPPER';
WorldpayConstants.THREEDERROR = '3DERROR';
WorldpayConstants.THREEDSINVALIDERROR = '3DS_INVALID_ERROR';
WorldpayConstants.NOT_IDENTIFIED_NOID = 'NOT_IDENTIFIED_NOID';
WorldpayConstants.VISASSL = 'VISA-SSL';
WorldpayConstants.AUTHORIZED = 'AUTHORIZED';
WorldpayConstants.CAPTURED = 'CAPTURED';
WorldpayConstants.VOIDED = 'VOIDED';
WorldpayConstants.PENDING = 'PENDING';
WorldpayConstants.REFUSED = 'REFUSED';
WorldpayConstants.OPEN = 'OPEN';
WorldpayConstants.ORDERDESCRIPTION = 'Merchant Order Number : ';
WorldpayConstants.ACCEPT = 'accept';
WorldpayConstants.MD = 'MD';
WorldpayConstants.PARES = 'PaRes';
WorldpayConstants.PAYMENT_SERVICE_ID = 'int_access_worldpay.http.worldpay.payment.post';
WorldpayConstants.TOKEN_SERVICE_ID = 'int_access_worldpay.http.worldpay.token.post';
WorldpayConstants.INTELLIGENT_TOKEN_SERVICE_ID = 'int_access_worldpay.http.worldpay.intelligent.token.post';
WorldpayConstants.THREE_DS_SERVICE_ID = 'int_access_worldpay.http.worldpay.3ds.post';
WorldpayConstants.VERIFIED_TOKEN_SERVICE_ID = 'int_access_worldpay.http.worldpay.verifiedTokens.post';
WorldpayConstants.OMS_AUTH_SERVICE_ID = 'order.management.auth-RefArch';
WorldpayConstants.OMS_API_ENDPOINT = '/services/apexrest/oms_worldpay/Worldpay-Notify';
WorldpayConstants.CANCEL_OR_REFUND = 'CancelOrRefund';
WorldpayConstants.EMPTY_RESPONSE = 'Empty Response';
WorldpayConstants.AUTHENTICATION_FAILED = 'authenticationFailed';
WorldpayConstants.EXEMPTION_SERVICE_ID = 'int_access_worldpay.http.worldpay.exemptions.post';
WorldpayConstants.SENT_FOR_REFUND = 'SENT_FOR_REFUND';
WorldpayConstants.SETTLED = 'SETTLED';
WorldpayConstants.INFORMATION_REQUESTED = 'INFORMATION_REQUESTED';
WorldpayConstants.CHARGED_BACK = 'CHARGED_BACK';
WorldpayConstants.EXPIRED = 'EXPIRED';
WorldpayConstants.SENTFORSETTLEMENT = 'Sent for Settlement';
WorldpayConstants.SENTFORCANCELLATION = 'Sent for Cancellation';

WorldpayConstants.DIRECT = 'DIRECT';
WorldpayConstants.REDIRECT = 'REDIRECT';
WorldpayConstants.CANCELLEDSTATUS = 'CANCELLED';
WorldpayConstants.FAILEDSTATUS = 'FAILED';
WorldpayConstants.XMLPAYMENTSERVICE = 'paymentService';
WorldpayConstants.XMLORDERSTATUSEVENT = 'orderStatusEvent';
WorldpayConstants.XMLLASTEVENT = 'lastEvent';
WorldpayConstants.XMLPAYMENTOPTION = 'paymentOption';
WorldpayConstants.merchanttokenType = 'Merchant';
WorldpayConstants.CORPORATE = 'corporate';
WorldpayConstants.CORPSAVINGS = 'corporatesavings';
WorldpayConstants.CORPORATESAVINGS = 'corporateSavings';

// APM Names
WorldpayConstants.WORLDPAY = 'Worldpay';
WorldpayConstants.CREDITCARD = 'CREDIT_CARD';
WorldpayConstants.GOOGLEPAY = 'GooglePay';
WorldpayConstants.ACHPAY = 'ACH_DIRECT_DEBIT-SSL';
WorldpayConstants.BANKACCOUNTS_US = 'bankAccountUS';
WorldpayConstants.REFUSED = 'refused';
WorldpayConstants.LOOKUPCOUNTRY = 'US';

WorldpayConstants.WEVDAVPATH = '/on/demandware.servlet/webdav/Sites';
WorldpayConstants.PMETHOD = 'https://';

// Error Numbers
WorldpayConstants.NOTIFYERRORCODE111 = '111';
WorldpayConstants.NOTIFYERRORCODE112 = '112';
WorldpayConstants.NOTIFYERRORCODE113 = '113';
WorldpayConstants.NOTIFYERRORCODE114 = '114';
WorldpayConstants.NOTIFYERRORCODE115 = '115';
WorldpayConstants.NOTIFYERRORCODE116 = '116';
WorldpayConstants.NOTIFYERRORCODE117 = '117';
WorldpayConstants.NOTIFYERRORCODE118 = '118';
WorldpayConstants.NOTIFYERRORCODE119 = '119';
WorldpayConstants.NOTIFYERRORCODE120 = '120';

WorldpayConstants.PAYMENTSTATUS = 'paymentStatus';
WorldpayConstants.APMNAME = 'apmName';
WorldpayConstants.ORDERTOKEN = 'order_token';
WorldpayConstants.ORDERID = 'order_id';
WorldpayConstants.DEBITCREDITINDICATOR = 'credit';
WorldpayConstants.CUSTOMERORDER = 'Customer';

WorldpayConstants.TRADING_NAME = 'trading name';
WorldpayConstants.MOTO_ORDER = 'moto';
WorldpayConstants.APPLEPAY = 'DW_APPLE_PAY';

module.exports = WorldpayConstants;
