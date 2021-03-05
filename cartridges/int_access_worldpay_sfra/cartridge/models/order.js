'use strict';

var base = module.superModule;
var OrderMgr = require('dw/order/OrderMgr');

/**
 * Order class that represents the current order
 * @param {dw.order.LineItemCtnr} lineItemContainer - Current users's basket/order
 * @param {Object} options - The current order's line items
 * @constructor
 */
function OrderModel(lineItemContainer, options) {
    base.call(this, lineItemContainer, options);
    if (this.orderNumber != null) {
        var orderobj = OrderMgr.getOrder(this.orderNumber);
        this.confstatus = orderobj.confirmationStatus;
    }
}

OrderModel.prototype = Object.create(base.prototype);
module.exports = OrderModel;
