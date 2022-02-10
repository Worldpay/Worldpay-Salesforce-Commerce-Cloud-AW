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
var worldpayConstants = require('*/cartridge/scripts/common/worldpayConstants');
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
    var ArrayList = require('dw/util/ArrayList');
    var OrderMgr = require('dw/order/OrderMgr');
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
        if (updateStatus.equals(worldpayConstants.AUTHORIZED) && reference) {
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

        if ((updateStatus.equals(worldpayConstants.SENT_FOR_REFUND)) && reference) {
            Logger.getLogger('worldpay').debug('Update Order Status for Order: ' + order.orderNo + ' is ' + updateStatus);
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
            order.custom.omsUpdatePending = true;
        }

        if (updateStatus.equals(worldpayConstants.AUTHORIZED)) {
            order.setStatus(Order.ORDER_STATUS_OPEN);
            order.setExportStatus(Order.EXPORT_STATUS_READY);
            order.setConfirmationStatus(Order.CONFIRMATION_STATUS_CONFIRMED);
            Logger.getLogger('worldpay').debug('Update Order Status for Order: ' + order.orderNo + ' is ' + updateStatus);
        } else if (updateStatus.equals(worldpayConstants.REFUSED)) {
                // No Change-Fail Order pipelet already called
        } else if (updateStatus.equals(Order.ORDER_STATUS_CANCELLED)) {
            if (order.getStatus().valueOf() === Order.ORDER_STATUS_NEW || order.getStatus().valueOf() === Order.ORDER_STATUS_OPEN) {
                OrderMgr.cancelOrder(order);
                Logger.getLogger('worldpay').debug('Update Order Status ' + updateStatus + ' Order: ' + order.orderNo + ' cancelled after New/ Open status.');
            } else if (order.getStatus().valueOf() === Order.ORDER_STATUS_CREATED) {
                OrderMgr.failOrder(order);
                Logger.getLogger('worldpay').debug('Update Order Status ' + updateStatus + ' Order: ' + order.orderNo + ' failed after created status.');
            }
            order.setExportStatus(Order.EXPORT_STATUS_NOTEXPORTED);
            order.setPaymentStatus(Order.PAYMENT_STATUS_NOTPAID);
            order.setConfirmationStatus(Order.CONFIRMATION_STATUS_NOTCONFIRMED);
        } else if (updateStatus.equalsIgnoreCase(worldpayConstants.CAPTURED)) {
            order.setStatus(Order.ORDER_STATUS_COMPLETED);
            order.setPaymentStatus(Order.PAYMENT_STATUS_PAID);
            Logger.getLogger('worldpay').debug('Update Order Status ' + updateStatus + ' Order: ' + order.orderNo + ' Payment status is paid.');
        } else if (updateStatus.equalsIgnoreCase(worldpayConstants.SENT_FOR_REFUND)) {
                // No Change
        } else if (updateStatus.equalsIgnoreCase(worldpayConstants.SETTLED)) {
                // No Change
        } else if (updateStatus.equalsIgnoreCase(worldpayConstants.INFORMATION_REQUESTED)) {
                // No Change
        } else if (updateStatus.equalsIgnoreCase(worldpayConstants.CHARGED_BACK)) {
                // No Change
        } else if (updateStatus.equalsIgnoreCase(worldpayConstants.EXPIRED)) {
            if (order.getStatus().valueOf() === Order.ORDER_STATUS_NEW || order.getStatus().valueOf() === Order.ORDER_STATUS_OPEN) {
                // Uncomment the next line if you are not integrated with Salesforce OMS
                order.setStatus(Order.ORDER_STATUS_CANCELLED);
                order.setExportStatus(Order.EXPORT_STATUS_NOTEXPORTED);
                order.setPaymentStatus(Order.PAYMENT_STATUS_NOTPAID);
                order.setConfirmationStatus(Order.CONFIRMATION_STATUS_NOTCONFIRMED);
                Logger.getLogger('worldpay').debug('Update Order Status ' + updateStatus + ' Order: ' + order.orderNo + ' not comfirmed');
            }
        } else {
                // No Change
        }
        Transaction.commit();
        return { success: true };
    } catch (e) {
        var errorCode = worldpayConstants.NOTIFYERRORCODE116;
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
