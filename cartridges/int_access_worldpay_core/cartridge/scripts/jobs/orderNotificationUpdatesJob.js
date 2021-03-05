/* eslint-disable no-continue */
'use strict';

/**
 * Defines alternate flow in case of null Order or non worldpay Order
 * or Order without state or Order with error in State
 * @param {number} errorCount - total error Count
 * @param {dw.util.ArrayList} errorList - List of all occurred errors
 * @param {string} errorMessage - Corresponding error message
 * @param {number} orderNo - Order Number
 * @param {string} JSONString - String representation of XML
 * @param {number} customObjectID - Custom Object ID
 * @return {Object} returns an object
 */
function alternateFlow(errorCount, errorList, errorMessage, orderNo, JSONString, customObjectID) {
    var errorCountIncrement = errorCount + 1;
    var generateErrorMessageForJobResult = require('*/cartridge/scripts/pipelets/generateErrorMessageForJob').generateErrorMessageForJob(errorMessage, orderNo, JSONString, errorList);
    var worldPayJobs = require('*/cartridge/scripts/jobs/worldpayJobs');
    worldPayJobs.removeCustomObject(customObjectID);
    return { errorCount: errorCountIncrement, errorString: generateErrorMessageForJobResult.errorString, errorList: generateErrorMessageForJobResult.errorListResult };
}
/**
 * Batch job for reading Custom Objects of Order Notifications and updating Order Statuses for AWP *
 */
function orderNotificationUpdateJobAWP() {
    var Util = require('dw/util');
    var errorCount = 0;
    var errorString = '';
    var errorList = new Util.ArrayList();
    var totalCount = 0;
    var alternateFLowResult = '';
    var Net = require('dw/net');
    var Resource = require('dw/web/Resource');
    var worldPayJobs = require('*/cartridge/scripts/jobs/worldpayJobs');
    var Site = require('dw/system/Site');
    var Order = require('dw/order/OrderMgr');
    var CustomObjectMgr = require('dw/object/CustomObjectMgr');
    var searchResultIterator = CustomObjectMgr.queryCustomObjects('OrderNotifyUpdatesForAWP', '', 'creationDate', null);
    if (searchResultIterator.getCount() > 0) {
        while (searchResultIterator.hasNext()) {
            var result = searchResultIterator.next();
            var errorMessage;
            var orderNo = result.custom.orderNo;
            var customObjectID = result.custom.ID;
            totalCount += 1;
            var readCustomObject = worldPayJobs.readCustomObject(customObjectID);
            var changedStatus = readCustomObject.changedStatus;
            var response = readCustomObject.response;
            var JSONString = readCustomObject.JSONString;
            var updateStatus = changedStatus;
            if (updateStatus != null) {
                var order = Order.getOrder(orderNo);
                if (!order || order == null) {
                    errorMessage = 'order does not exist';
                    alternateFLowResult = alternateFlow(errorCount, errorList, errorMessage, orderNo, JSONString, customObjectID);
                    errorCount = alternateFLowResult.errorCount;
                    errorList = alternateFLowResult.errorList;
                    errorString = alternateFLowResult.errorString;
                    continue;
                }
                var checkWorldpayOrderResult = require('*/cartridge/scripts/pipelets/checkWorldpayOrder').checkWorldpayOrder(order);
                if (!checkWorldpayOrderResult.WorldpayOrderFound) {
                    errorMessage = 'Not a worldpay order';
                    alternateFLowResult = alternateFlow(errorCount, errorList, errorMessage, orderNo, JSONString, customObjectID);
                    errorCount = alternateFLowResult.errorCount;
                    errorList = alternateFLowResult.errorList;
                    errorString = alternateFLowResult.errorString;
                    continue;
                }

                // WorldpayJobs-UpdateOrderStatus
                var flag = worldPayJobs.updateOrderStatus(order, updateStatus, response);
                if (!flag) {
                    errorMessage = 'Error in order status update';
                    alternateFLowResult = alternateFlow(errorCount, errorList, errorMessage, orderNo, JSONString, customObjectID);
                    errorCount = alternateFLowResult.errorCount;
                    errorList = alternateFLowResult.errorList;
                    errorString = alternateFLowResult.errorString;
                    continue;
                }
                worldPayJobs.removeCustomObject(customObjectID);
            } else {
                errorMessage = 'No status to update ' + updateStatus;
                alternateFLowResult = alternateFlow(errorCount, errorList, errorMessage, orderNo, JSONString, customObjectID);
                errorCount = alternateFLowResult.errorCount;
                errorList = alternateFLowResult.errorList;
                errorString = alternateFLowResult.errorString;
                continue;
            }
        }

        if (Site.getCurrent().getCustomPreferenceValue('EnableJobMailerService')) {
            if (errorCount > 0) {
                var writeToNotifyLogResult = require('*/cartridge/scripts/pipelets/writeToNotifyLog').writeToNotifyLog(errorList);
                var mailTo = Site.getCurrent().getCustomPreferenceValue('NotifyJobMailTo').toString();
                var mailFrom = Site.getCurrent().getCustomPreferenceValue('NotifyJobMailFrom').toString();
                var mailCC = Site.getCurrent().getCustomPreferenceValue('NotifyJobMailCC').toString();
                var renderingParameters = new Util.HashMap();
                renderingParameters.put('totalCount', totalCount);
                renderingParameters.put('errorCount', errorCount);
                renderingParameters.put('filePath', writeToNotifyLogResult.filePath);
                renderingParameters.put('errorString', errorString);
                var template = new Util.Template('emailtemplateforjob.isml');
                var content = template.render(renderingParameters);
                var mail = new Net.Mail();

                mail.addTo(mailTo);
                mail.setFrom(mailFrom);
                mail.addCc(mailCC);
                mail.setSubject(Resource.msg('notify.Job.subjectLine', 'worldpay', null).toString());
                mail.setContent(content);
                mail.send();
            } else {
                return;
            }
        } else {
            return;
        }
    } else {
        return;
    }
}


/** Exported functions **/
module.exports = {
    orderNotificationUpdateJobAWP: orderNotificationUpdateJobAWP
};
