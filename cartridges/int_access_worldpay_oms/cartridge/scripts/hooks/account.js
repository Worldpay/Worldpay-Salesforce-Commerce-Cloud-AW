'use strict';

const Logger = require('dw/system/Logger');
const ServiceMgr = require('*/cartridge/scripts/ServiceMgr');
const Site = require('dw/system/Site').current;

const OMSOrder = require('*/cartridge/scripts/models/omsOrder');
const LOGGER = Logger.getLogger('worldpay_oms', 'hooks.account');
let enableFallbackOrderStatus = Site.getCustomPreferenceValue('enableFallbackOrderStatus');

/**
 * Check Order status in OMS
 * @param {string} orderNumber - Order Number
 * @returns {Array} omsOrdersResponse -- array of the models carrying response from the OMS
 * @description This method queries the OMS using the Apex REST APIs -- passes the eamil address of the customer & tries to get the orders of this user.
 * Assumes that all the customer orders are tied to this email address only i.e customer resolution is based on Email only -- inline to OMS..
 *
 */
function checkStatusInOMS(orderNumber) {
    var svc;
    var endpoint;
    var omsOrdersResponse = {};
    var result;
    var orderObj;

    try {
        svc = ServiceMgr.restGet();
        endpoint = ServiceMgr.restEndpoints.get.orderStatus;

        if (typeof svc === 'undefined' || empty(endpoint)) {
            return;
        }
        result = svc.call(endpoint, orderNumber);
        if (result.status === 'OK') {
            if (result.object && !result.object.isError && !result.object.isAuthError) {
                orderObj = result.object.responseObj;
                omsOrdersResponse = new OMSOrder(orderNumber, orderObj);
            }
        } else if (enableFallbackOrderStatus) {
            // in-case the order is never made into OMS, we show b2c order status based on preference.
            omsOrdersResponse = new OMSOrder(orderNumber);
        } else {
            LOGGER.error('There is an error while querying the order status from OMS');
        }
    } catch (e) {
        LOGGER.error('Error occurred while getting the Order Status, details: {0}', e.message);
        throw e;
    }
    // eslint-disable-next-line consistent-return
    return omsOrdersResponse;
}

exports.checkStatusInOMS = checkStatusInOMS;
