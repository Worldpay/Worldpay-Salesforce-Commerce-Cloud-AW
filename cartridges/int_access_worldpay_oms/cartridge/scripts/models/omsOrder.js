'use strict';

var Site = require('dw/system/Site').current;
var overrideOMSStatusValues = Site.getCustomPreferenceValue('overrideOMSStatusValues');

/**
 * This function takes the orderSummary Status from OMS and finds the relevant B2C status
 * from the site preference based on the business requirement.
 * @param {string} status - OMS order status
 * @returns {*} - Status that would be visible in MyAccount
 */
function getReadableStatusForShopper(status) {
    // trim spaces and convert to lowercase and then lookup
    var displayStatus;
    var omsStatus = (status) ? status.trim().toLowerCase() : '';
    var result = {};

    var configObj = Site.getCustomPreferenceValue('b2cStatusMapping');
    // trim and convert the keys of status object into lowercase
    try {
        var mappingObj = JSON.parse(configObj);
        Object.keys(mappingObj).forEach(function (key) {
            var $key = key.trim().toLowerCase();
            result[$key] = mappingObj[key];
        });
        displayStatus = result[omsStatus];
    } catch (e) {
        // error comes
    }
    return displayStatus;
}

/**
 * Returns the order status for a given order
 * @param {string} orderNumber - order number
 * @returns {string} status - status of order
 */
function getB2COrderStatus(orderNumber) {
    var OrderMgr = require('dw/order/OrderMgr');
    var status;
    var order = OrderMgr.getOrder(orderNumber);
    status = (order) ? order.getStatus().getDisplayValue() : status;

    return status;
}


/**
 * OMSOrder class
 * @param {Object} [orderNumber] - order number
 * @param {Object} [omsOrder] - order representation returned from OMS
 * @constructor
 */
function OMSOrder(orderNumber, omsOrder) {
    if (omsOrder) {
        this.omsFulfillmentOrderURL = omsOrder.attributes.url;
        this.omsOrderSummaryID = omsOrder.OrderSummaryId;
        this.omsFulfillmentOrderID = omsOrder.Id;
        this.commerceOrderNumber = omsOrder.OrderNumber;
        this.omsFulfllmentOrderStatus = (overrideOMSStatusValues) ?
            getReadableStatusForShopper(omsOrder.Status) : omsOrder.Status;
    }
    this.b2cOrderStatus = getB2COrderStatus(orderNumber);
}

module.exports = OMSOrder;
