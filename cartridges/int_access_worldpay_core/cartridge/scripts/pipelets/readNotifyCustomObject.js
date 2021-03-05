/**
* Demandware Script File
* This script reads the custom object based on customObjectID , reads the xnlstring in that custom Object
* and returns the changed status recieved in status notification
*
*   @input customObjectID :  String
*   @output changedStatus : String
*   @output JSONString : String
*   @output  response : Object
*/

var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var Logger = require('dw/system/Logger');
var Utils = require('*/cartridge/scripts/common/utils');
var WorldpayConstants = require('*/cartridge/scripts/common/worldpayConstants');

/**
 * Reads OrderNotifyUpdates custom object
 * @param {number} customObjectID - Custom Object ID
 * @return {Object} returns an JSON object
 */
function readNotifyCustomObjectAWP(customObjectID) {
    var customObj = customObjectID;
    var notifyCO;
    var changedStatus;
    var JSONString;
    var response;
    var errorCode;
    var errorMessage;
    try {
        if (!customObj || customObj === null) {
            return { success: false, changedStatus: changedStatus, JSONString: JSONString, response: response };
        }
        // Get Custom Object based on passed custom object id.
        notifyCO = CustomObjectMgr.getCustomObject('OrderNotifyUpdatesForAWP', customObj);
        if (notifyCO && notifyCO !== null && notifyCO !== '') {
            JSONString = notifyCO.custom.JSONString;
            try {
                if (JSONString != null) {
                    this.content = JSON.parse(JSONString);
                    response = Utils.parseResponse(JSONString);
                } else {
                    errorCode = WorldpayConstants.NOTIFYERRORCODE111;
                    errorMessage = Utils.getErrorMessage(errorCode);
                    Logger.getLogger('worldpay').error('Order Notification : Read Custom Object : ' + errorCode + ' : ' + errorMessage + ' : ' + JSONString);
                    return { success: false, changedStatus: changedStatus, JSONString: JSONString, response: response };
                }
            } catch (ex) {
                this.status = false;
                errorCode = WorldpayConstants.NOTIFYERRORCODE112;
                errorMessage = Utils.getErrorMessage(errorCode);
                Logger.getLogger('worldpay').error('Order Notification : Read Custom Object : ' + errorCode + ' : ' + errorMessage + ' : ' + JSONString + ' : ' + ex);
                return { success: false, changedStatus: changedStatus, JSONString: JSONString, response: response };
            }
            var orderCode;
            try {
                var temp = this.content;
                if (Object.prototype.hasOwnProperty.call(temp, 'eventDetails') && Object.prototype.hasOwnProperty.call(temp.eventDetails, 'type')) {
                    changedStatus = temp.eventDetails.type;
                } else {
                    errorCode = WorldpayConstants.NOTIFYERRORCODE112;
                    errorMessage = Utils.getErrorMessage(errorCode);
                    Logger.getLogger('worldpay').error('Order Notification : Read Custom Object : ' + errorCode + ' : ' + errorMessage + ' : ' + JSONString);
                    return { success: false, changedStatus: changedStatus, JSONString: JSONString, response: response };
                }
            } catch (ex) {
                errorCode = WorldpayConstants.NOTIFYERRORCODE117;
                errorMessage = Utils.getErrorMessage(errorCode);
                Logger.getLogger('worldpay').error('Order Notification : Read Custom Object : ' + errorCode + ' : ' + errorMessage + ' : ' + JSONString + ' : ' + ex);
                return { success: false, changedStatus: changedStatus, JSONString: JSONString, response: response, orderCode: orderCode };
            }
            changedStatus = changedStatus.toString();
        }
    } catch (e) {
        errorCode = WorldpayConstants.NOTIFYERRORCODE117;
        errorMessage = Utils.getErrorMessage(errorCode);
        Logger.getLogger('worldpay').error('Order Notification : Read Custom Object : ' + errorCode + ' : ' + errorMessage + ' : ' + e);
        return { success: false, changedStatus: changedStatus, JSONString: JSONString, response: response };
    }
    return { success: true, changedStatus: changedStatus, JSONString: JSONString, response: response };
}
/** Exported functions **/
module.exports = {
    readNotifyCustomObjectAWP: readNotifyCustomObjectAWP
};
