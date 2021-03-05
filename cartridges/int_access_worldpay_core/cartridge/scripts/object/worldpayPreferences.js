/**
 * WorldpayPreferences object contains all configuration data,
 * which are necessary to call the worldpay service.
 * This data is retrieved from custom site preferences.
 *
 * To include this script use:
 *
 */
var Site = require('dw/system/Site');

/**
 * empty placeholder function
 */
function WorldpayPreferences() { }

/**
 * Returns the site preference
 * @param {string} preference - Current users's order
 * @return {Object} returns site preference value
 */
function getSitePeference(preference) {
    var result = null;
    var loggerSource = '[worldPayPreferences.js]';
    var Logger = require('dw/system/Logger');
    result = Site.getCurrent().getCustomPreferenceValue(preference);
    if (result === null) {
        Logger.error('{0} Site specific custom preference "{1}" is missing.', loggerSource, preference);
    }
    return result;
}

WorldpayPreferences.prototype = {
    worldPayPreferencesInit: function () {
        this.currencyExponent = getSitePeference('AWPWorldpayCurrencyExponent');
        this.EnableCCTokenization = getSitePeference('AWPEnableCCTokenization');
        this.challengePreference = getSitePeference('AWPchallengePreference');
        this.challengeWindowSize = getSitePeference('AWPchallengeWindowSize');
        this.includeRiskData = getSitePeference('AWPRiskData');
        this.threeDSType = getSitePeference('AWPdstype');
        this.apiEPJson = JSON.parse(getSitePeference('AWPEPJSON'));
        return this;
    },

    missingPreferences: function () {
        return (this.currencyExponent.value != null);
    },

    getAPIEndpoint: function (api, action) {
        return this.apiEPJson[api][action];
    },

    /**
     * Returns the current locale of the current site.
     * If locale is set to default, the return value is 'en_US'
     * @return {string} returns site locale object
     */
    getLocale: function () {
        // assume that en_US is the default locale
        var Locale = require('dw/util/Locale');
        var result = Locale.getLocale('en_US');
        if (Site.getCurrent().getDefaultLocale() !== 'default') {
            result = Locale.getLocale(Site.getCurrent().getDefaultLocale());
        }
        return result;
    }
};
module.exports = WorldpayPreferences;
