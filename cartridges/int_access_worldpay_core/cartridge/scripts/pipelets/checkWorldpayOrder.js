/**
 * Check if order as input is worldpay order or not. and return error in not
 * @param {dw.order.Order} orderObj - Current users's Order
 * @return {Object} returns an object
 */
function checkWorldpayOrder(orderObj) {
    try {
        var worldPayOrderFound = false;
        if (!orderObj) {
            return { success: true, WorldpayOrderFound: worldPayOrderFound };
        }
        var Logger = require('dw/system/Logger');
        var PaymentMgr = require('dw/order/PaymentMgr');
        var PaymentInstrument;
        var paymentInstruments = orderObj.getPaymentInstruments();
        if (paymentInstruments) {
            var payInstItr = paymentInstruments.iterator();
            var orderPI;
            var processorID;
            while (payInstItr.hasNext()) {
                orderPI = payInstItr.next();
                processorID = PaymentMgr.getPaymentMethod(orderPI.getPaymentMethod()).paymentProcessor.ID;
                Logger.getLogger('worldpay').debug(orderObj.orderNo + ' order token requested : ' + orderPI.custom.wpTokenRequested);
                if (processorID.equalsIgnoreCase(require('*/cartridge/scripts/common/worldpayConstants').WORLDPAY)) {
                    PaymentInstrument = orderPI;
                    worldPayOrderFound = true;
                    return { success: true, WorldpayOrderFound: worldPayOrderFound, PaymentInstrument: PaymentInstrument };
                }
            }
        }
        return { success: true, WorldpayOrderFound: worldPayOrderFound, PaymentInstrument: PaymentInstrument };
    } catch (Exception) {
        return { success: false };
    }
}

/** Exported functions **/
module.exports = {
    checkWorldpayOrder: checkWorldpayOrder
};
