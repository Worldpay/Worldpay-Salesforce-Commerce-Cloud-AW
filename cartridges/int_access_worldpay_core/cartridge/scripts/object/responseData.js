/* eslint-disable */
var Logger = require('dw/system/Logger');

function ResponseData() {
}

ResponseData.prototype = {
    parseJSON : function(responseJSON) {

        this.outcome = '';
        this.errorName = '';
        this.errorCode = '';
        this.message = '';
        this.validationErrors = '';
        this.tokenPaymentInstrument = '';
        this.tokenId = '';
        this.tokenExpiryDateTime = '';
        this.cancelUrl = '';
        this.settleUrl = '';
        this.partialSettleUrl = '';
        this.refundUrl = '';
        this.partialRefundUrl = '';
        this.JWT = '';
        this.ddcURL = '';
        this.bin = '';
        this.challengeReference = '';
        this.challengeURL = '';
        this.challengeJWT = '';
        this.authentication3ds = '';
        this.verificationUrl = '';
        this.tokenUrl = '';
        this.webCSDKCCHolderName = '';
        this.webCSDKCCType = '';
        this.webCSDKCCNumber = '';
        this.webCSDKCCExpMonth = '';
        this.webCSDKCCExpYear = '';
        this.tokenConflictUrl = '';
        this.tokenConflictExpDate = '';
        this.tokenConflictName = '';
        this.tokenExpdateURL = '';
        this.tokenCcHolderNameURL = '';

        try {
            this.content = JSON.parse(responseJSON);
        } catch (ex) {
            this.status = false;
            Logger.getLogger("worldpay").error("Ivalid response JSON:" + responseJSON + "unable to parse it" + ex.message);
            return;
        }
        if (this.content) {
            var c = this.content;
            try {
                if (c.hasOwnProperty('outcome')) {
                    this.outcome = c.outcome;
                }
                if (this.outcome == 'authorized') {
                    if (c._links['payments:cancel']) {
                        this.cancelUrl = c._links['payments:cancel'].href;
                    }
                    if (c._links['payments:settle']) {
                        this.settleUrl = c._links['payments:settle'].href;
                    }
                    if (c._links['payments:partialSettle']) {
                        this.partialSettleUrl = c._links['payments:partialSettle'].href;
                    }
                }
                if (c.hasOwnProperty('_links')) {
                    if (c._links['tokens:token']) {
                        this.tokenUrl = c._links['tokens:token'].href;
                    }
                    if (c._links['payments:refund']) {
                        this.refundUrl = c._links['payments:refund'].href;
                    }
                    if (c._links['payments:partialRefund']) {
                        this.partialRefundUrl = c._links['payments:partialRefund'].href;
                    }
                    if (c._links['tokens:cardExpiryDate']) {
                        this.tokenExpdateURL = c._links['tokens:cardExpiryDate'].href;
                    }
                    if (c._links['tokens:cardHolderName']) {
                        this.tokenCcHolderNameURL = c._links['tokens:cardHolderName'].href;
                    }
                }

                if (c.paymentInstrument) {
                    if (c.paymentInstrument.cardHolderName) {
                        this.webCSDKCCHolderName = c.paymentInstrument.cardHolderName
                    }
                    if (c.paymentInstrument.type) {
                        this.webCSDKCCType = c.paymentInstrument.brand;
                    }
                    if (c.paymentInstrument.cardNumber) {
                        this.webCSDKCCNumber = c.paymentInstrument.cardNumber;
                    }
                    if (c.paymentInstrument.cardExpiryDate) {
                        this.webCSDKCCExpMonth = c.paymentInstrument.cardExpiryDate.month;
                        this.webCSDKCCExpYear = c.paymentInstrument.cardExpiryDate.year;
                    }
                }

                if (c.conflicts) {
                    if (c.conflicts.paymentInstrument) {
                        if (c.conflicts.paymentInstrument.cardExpiryDate) {
                            this.tokenConflictExpDate = c.conflicts.paymentInstrument.cardExpiryDate;
                        }
                        if (c.conflicts.paymentInstrument.cardHolderName) {
                            this.tokenConflictName = c.conflicts.paymentInstrument.cardHolderName;
                        }
                    }
                }

                if (this.outcome == 'verified') {
                    if (c._links['verifications:verification']) {
                        this.verificationUrl = c._links['verifications:verification'].href;
                    }
                    if (c._links['tokens:token']) {
                        this.tokenId = c._links['tokens:token'].href;
                    }
                    if (c._links['tokens:conflicts']) {
                        this.tokenConflictUrl = c._links['tokens:conflicts'].href;
                    }
                }

                if (c.hasOwnProperty('errorName')) {
                    this.errorName = c.errorName;
                }
                if (c.hasOwnProperty('code')) {
                    this.errorCode = c.code;
                }
                if (c.hasOwnProperty('message')) {
                    this.message = c.message;
                }
                if (c.hasOwnProperty('validationErrors')) {
                    this.validationErrors = c.validationErrors;
                }
                if (c.hasOwnProperty('tokenPaymentInstrument')) {
                    this.tokenPaymentInstrument = c.tokenPaymentInstrument.href;
                }
                if (c.hasOwnProperty('tokenId')) {
                    this.tokenId = c.tokenId;
                }
                if (c.hasOwnProperty('tokenExpiryDateTime')) {
                    this.tokenExpiryDateTime = c.tokenExpiryDateTime;
                }
                if (c.hasOwnProperty('deviceDataCollection')) {
                    if (c.deviceDataCollection.hasOwnProperty('jwt')) {
                        this.JWT = c.deviceDataCollection.jwt;
                    }
                    if (c.deviceDataCollection.hasOwnProperty('url')) {
                        this.ddcURL = c.deviceDataCollection.url;
                    }
                    if (c.deviceDataCollection.hasOwnProperty('bin')) {
                        this.bin = c.deviceDataCollection.bin;
                    }
                }
                if (c.hasOwnProperty('challenge')) {
                    if (c.challenge.hasOwnProperty('reference')) {
                        this.challengeReference = c.challenge.reference;
                    }
                    if (c.challenge.hasOwnProperty('url')) {
                        this.challengeURL = c.challenge.url;
                    }
                    if (c.challenge.hasOwnProperty('jwt')) {
                        this.challengeJWT = c.challenge.jwt;
                    }
                }
                if (c.hasOwnProperty('authentication')) {
                    this.authentication3ds = c.authentication;
                }
            } catch (ex) {
                this.status = false;
                this.error = true;
                Logger.getLogger("worldpay").error("Error parsing the JSON response:" + ex.message);
                return;
            }
        }
        return this;
    },

    setStatus : function(status) {
        this.status = status;
    },

    getStatus : function() {
        return this.status;
    },

    toString : function() {
        return this.content.toString();
    },

    getErrorName : function() {
        return this.errorName;
    },

    isError : function() {
        return (!empty(this.errorName) || !empty(this.errorCode)) ? true
                : false;
    },

    getErrorMessage : function() {
        return this.message;
    },

    getErrorCode : function() {
        return this.errorCode;
    }

}
module.exports = ResponseData;
