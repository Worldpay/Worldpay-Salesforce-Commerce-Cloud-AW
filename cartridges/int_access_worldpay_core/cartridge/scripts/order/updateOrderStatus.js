/**
* Demandware Script File
* This script updates the OrderStatus,ExportStatus, PaymentStatus , ConfirmationStatus in Order
* Object depending on the changed status notification recieved. It also prepends the status
* and timestamp to the statusHistory.
*
* @input Order : dw.order.Order The order.
* @input response : Object
* @input updateStatus : String
* @input customObjectID :  String
*/

var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var Logger = require('dw/system/Logger');
var Order = require('dw/order/Order');
var Utils = require('*/cartridge/scripts/common/utils');
var WorldpayConstants = require('*/cartridge/scripts/common/worldpayConstants');
var Transaction = require('dw/system/Transaction');

/**
 * This script updates the OrderStatus,ExportStatus, PaymentStatus , ConfirmationStatus in Order
 * Object depending on the changed status notification recieved. It also prepends the status
 * and timestamp to the statusHistory.
 * @param {dw.order.Order} orderToBeUpdated - Current users's Order
 * @param {Object} response - Response
 * @param {string} updateStatus - Update Status
 * @param {string} customObjectID - Custom Object ID
 * @return {Object} returns an object
 */
function updateOrderStatus(orderToBeUpdated, response, updateStatus, customObjectID) {
    var Resource = require('dw/web/Resource');
    var ArrayList = require('dw/util/ArrayList');
    Transaction.begin();
    var notifyCO;
    var customObj = customObjectID;
    var COtimeStamp;
    var order = orderToBeUpdated;
    try {
        if (customObj == null) {
            COtimeStamp = new Date();
        } else {
            // Get Custom Object based on passed custom object id.
            notifyCO = CustomObjectMgr.getCustomObject('OrderNotifyUpdatesForAWP', customObj);
            if (notifyCO != null && notifyCO !== '') {
                COtimeStamp = notifyCO.custom.timeStamp;
            }
        }

        // Include milliseconds to make unique entries in to AWPtransactionStatus, awpSettleReference, awpRefundReference
        var COtimeStampStr = COtimeStamp.toString();
        var gmtIndex = COtimeStampStr.indexOf('GMT') - 1;
        var COtime = (gmtIndex > 0) ? COtimeStampStr.slice(0, gmtIndex) : '';
        var COtimeStampWithMilliSeconds;
        if (COtime) {
            COtimeStampWithMilliSeconds = COtimeStampStr.replace(COtime, (COtime + ':' + COtimeStamp.getMilliseconds()));
        } else {
            COtimeStampWithMilliSeconds = COtimeStamp.toISOString();
        }

        var statusHist = order.custom.AWPtransactionStatus;
        var statusList;
        if (statusHist == null && statusHist.length < 0) {
            statusList = new ArrayList();
        } else {
            statusList = new ArrayList(statusHist);
        }
        statusList.addAt(0, (updateStatus + ':' + COtimeStampWithMilliSeconds));

        var amountInResponse = parseFloat(((response.content.eventDetails.amount.value) / 100));
        var reference = (amountInResponse).toString();
        if (updateStatus.equalsIgnoreCase(Resource.msg('notification.paymentStatus.CAPTURED', 'worldpay', null)) && reference) {
            var awpSettleRefStatusHist = order.custom.awpSettleReference; // statusHist
            var awpSettleRefStatusList;
            if (awpSettleRefStatusHist == null && awpSettleRefStatusHist.length < 0) {
                awpSettleRefStatusList = new ArrayList();
            } else {
                awpSettleRefStatusList = new ArrayList(awpSettleRefStatusHist);
            }
            awpSettleRefStatusList.addAt(0, (reference + ':' + COtimeStampWithMilliSeconds));
            order.custom.awpSettleReference = awpSettleRefStatusList;
        }


        if (updateStatus.equalsIgnoreCase(Resource.msg('notification.paymentStatus.SENT_FOR_REFUND', 'worldpay', null)) && reference) {
            var awpRefundRefStatusHist = order.custom.awpRefundReference; // statusHist
            var awprefundRefStatusList;
            if (awpRefundRefStatusHist == null && awpRefundRefStatusHist.length < 0) {
                awprefundRefStatusList = new ArrayList();
            } else {
                awprefundRefStatusList = new ArrayList(awpRefundRefStatusHist);
            }
            awprefundRefStatusList.addAt(0, (reference + ':' + COtimeStampWithMilliSeconds));
            order.custom.awpRefundReference = awprefundRefStatusList;
        }

        order.custom.AWPtransactionStatus = statusList;

        if (updateStatus) {
            order.custom.WorldpayLastEvent = updateStatus;
        }

        if (updateStatus.equalsIgnoreCase(Resource.msg('notification.paymentStatus.AUTHORISED', 'worldpay', null))) {
            order.setStatus(Order.ORDER_STATUS_OPEN);
            order.setExportStatus(Order.EXPORT_STATUS_READY);
            order.setConfirmationStatus(Order.CONFIRMATION_STATUS_CONFIRMED);
        } else if (updateStatus.equalsIgnoreCase(Resource.msg('notification.paymentStatus.REFUSED', 'worldpay', null))) {
                // No Change-Fail Order pipelet already called
        } else if (updateStatus.equalsIgnoreCase(Resource.msg('notification.paymentStatus.CANCELLED', 'worldpay', null))) {
            if (order.getStatus().valueOf() === Order.ORDER_STATUS_NEW || order.getStatus().valueOf() === Order.ORDER_STATUS_OPEN) {
                order.setStatus(Order.ORDER_STATUS_CANCELLED);
            } else if (order.getStatus().valueOf() === Order.ORDER_STATUS_CREATED) {
                order.setStatus(Order.ORDER_STATUS_FAILED);
            }
            order.setExportStatus(Order.EXPORT_STATUS_NOTEXPORTED);
            order.setPaymentStatus(Order.PAYMENT_STATUS_NOTPAID);
            order.setConfirmationStatus(Order.CONFIRMATION_STATUS_NOTCONFIRMED);
        } else if (updateStatus.equalsIgnoreCase(Resource.msg('notification.paymentStatus.CAPTURED', 'worldpay', null))) {
            order.setStatus(Order.ORDER_STATUS_COMPLETED);
            order.setPaymentStatus(Order.PAYMENT_STATUS_PAID);
        } else if (updateStatus.equalsIgnoreCase(Resource.msg('notification.paymentStatus.SENT_FOR_REFUND', 'worldpay', null))) {
                // No Change
        } else if (updateStatus.equalsIgnoreCase(Resource.msg('notification.paymentStatus.SETTLED', 'worldpay', null))) {
                // No Change
        } else if (updateStatus.equalsIgnoreCase(Resource.msg('notification.paymentStatus.INFORMATION_REQUESTED', 'worldpay', null))) {
                // No Change
        } else if (updateStatus.equalsIgnoreCase(Resource.msg('notification.paymentStatus.CHARGED_BACK', 'worldpay', null))) {
                // No Change
        } else if (updateStatus.equalsIgnoreCase(Resource.msg('notification.paymentStatus.EXPIRED', 'worldpay', null))) {
            if (order.getStatus().valueOf() === Order.ORDER_STATUS_NEW || order.getStatus().valueOf() === Order.ORDER_STATUS_OPEN) {
                // Uncomment the next line if you are not integrated with Salesforce OMS
                order.setStatus(Order.ORDER_STATUS_CANCELLED);
                order.setExportStatus(Order.EXPORT_STATUS_NOTEXPORTED);
                order.setPaymentStatus(Order.PAYMENT_STATUS_NOTPAID);
                order.setConfirmationStatus(Order.CONFIRMATION_STATUS_NOTCONFIRMED);
            }
        } else {
                // No Change
        }
        Transaction.commit();
        return { success: true };
    } catch (e) {
        var errorCode = WorldpayConstants.NOTIFYERRORCODE116;
        var errorMessage = Utils.getErrorMessage(errorCode);
        Logger.getLogger('worldpay').error('Order Notification : Update Order : ' + order.orderNo + ' : ' + errorCode + ' : ' + errorMessage + e);
        Transaction.commit();
        return { success: false };
    }
}

/** Exported functions **/
module.exports = {
    updateOrderStatus: updateOrderStatus
};
