const baseRequest = {
    apiVersion: 2,
    apiVersionMinor: 0
};


const allowedCardNetworks = ["AMEX", "DISCOVER", "JCB", "MASTERCARD", "VISA"];


const allowedCardAuthMethods = ["PAN_ONLY", "CRYPTOGRAM_3DS"];

var googleMerchantID = document.getElementById("AWPGooglePayMerchantID").value;
var googleMerchantName = document.getElementById("AWPGoogleMerchantName").value;
var gatewayMerchantID = document.getElementById("AWPGatewayMerchantId").value;
var gatewayMerchantName = document.getElementById("AWPGatewayMerchantName").value;

const tokenizationSpecification = {
    type: 'PAYMENT_GATEWAY',
    parameters: {
        'gateway': gatewayMerchantName,
        'gatewayMerchantId': gatewayMerchantID
    }
};


const baseCardPaymentMethod = {
    type: 'CARD',
    parameters: {
        allowedAuthMethods: allowedCardAuthMethods,
        allowedCardNetworks: allowedCardNetworks
    }
};


const cardPaymentMethod = Object.assign({},
    baseCardPaymentMethod, {
        tokenizationSpecification: tokenizationSpecification
    }
);

let paymentsClient = null;


function getGoogleIsReadyToPayRequest() {
    return Object.assign({},
        baseRequest, {
            allowedPaymentMethods: [baseCardPaymentMethod]
        }
    );
}



function getGooglePaymentDataRequest() {
    const paymentDataRequest = Object.assign({}, baseRequest);
    paymentDataRequest.allowedPaymentMethods = [cardPaymentMethod];
    paymentDataRequest.transactionInfo = getGoogleTransactionInfo();
    paymentDataRequest.merchantInfo = {
        merchantId: googleMerchantID,
        merchantName: googleMerchantName
    };
    return paymentDataRequest;
}


var googlePayEnvironment = document.getElementById("AWPGooglePayEnvironment").value;

function getGooglePaymentsClient() {
    if (paymentsClient === null) {
        paymentsClient = new google.payments.api.PaymentsClient({
            environment: googlePayEnvironment
        });
    }
    return paymentsClient;
}



function onGooglePayLoaded() {
    const paymentsClient = getGooglePaymentsClient();
    paymentsClient.isReadyToPay(getGoogleIsReadyToPayRequest())
        .then(function (response) {
            if (response.result) {
                addGooglePayButton();

            }
        })
        .catch(function (err) {
            // show error in developer console for debugging
            console.error(err);
        });
}



function addGooglePayButton() {
    const paymentsClient = getGooglePaymentsClient();
    const button =
        paymentsClient.createButton({
            onClick: onGooglePaymentButtonClicked
        });
    document.getElementById('containergpay').appendChild(button);
    document.getElementById('containergpay').setAttribute("data-set", "1");
}
var grossPrice = document.getElementById("grossPrice").value;
var currencyCode = document.getElementById("currencyCode").value;
var grossPriceleng = grossPrice.length;
var usablegrossPrice = grossPrice.slice(1, grossPriceleng);

function getGoogleTransactionInfo() {

    return {
        currencyCode: currencyCode,
        totalPriceStatus: 'FINAL',
        // set to cart total
        totalPrice: usablegrossPrice
    };
}


function prefetchGooglePaymentData() {
    const paymentDataRequest = getGooglePaymentDataRequest();
    // transactionInfo must be set but does not affect cache
    paymentDataRequest.transactionInfo = {
        totalPriceStatus: 'NOT_CURRENTLY_KNOWN',
        currencyCode: currencyCode
    };
    const paymentsClient = getGooglePaymentsClient();
    paymentsClient.prefetchPaymentData(paymentDataRequest);
}


function onGooglePaymentButtonClicked() {
    const paymentDataRequest = getGooglePaymentDataRequest();
    paymentDataRequest.transactionInfo = getGoogleTransactionInfo();

    const paymentsClient = getGooglePaymentsClient();
    paymentsClient.loadPaymentData(paymentDataRequest)
        .then(function (paymentData) {
            // handle the response
            processPaymentGpay(paymentData);
        })
        .catch(function (err) {
            // show error in developer console for debugging
            console.error(err);
        });
}

function processPaymentGpay(paymentData) {
    // show returned data in developer console for debugging
    var jsonString = (paymentData.paymentMethodData.tokenizationData.token);
    $('#gpaytoken').attr('value', jsonString);
    $("#gpayerror").html('');
}
