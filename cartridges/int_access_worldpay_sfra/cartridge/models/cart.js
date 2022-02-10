'use strict';

var base = module.superModule;

/**
 * Checks if the customer can use Instant Purchase
 * @param {dw.customer.Customer} customer - Customer
 * @return {*|boolean} - result
 */
function isEligibleForInstantPurchase(customer) {
    var isLoggedIn;
    var hasSavedCards;
    var hasSavedAddresses;
    isLoggedIn = (customer && customer.isAuthenticated());
    hasSavedCards = (isLoggedIn && customer.profile.wallet.getPaymentInstruments().length > 0);
    hasSavedAddresses = (isLoggedIn && customer.profile.addressBook.getAddresses().length > 0);
    return (isLoggedIn && hasSavedCards && hasSavedAddresses);
}

/**
 * Gets the Browser name from equest object
 * @return {string} - Browser Name
 */
function getBrowser() {
    var UserAgentHelper = require('*/cartridge/scripts/helpers/userAgentHelper'); // eslint-disable-next-line new-cap
    var UserAgent = UserAgentHelper.UserAgent();
    var UserAgentInfo = UserAgent.parse(request.getHttpUserAgent());
    return (UserAgentInfo.browser) ? UserAgentInfo.browser.toLowerCase() : '';
}


/**
 * @constructor
 * @classdesc CartModel class that represents the current basket
 *
 * @param {dw.order.Basket} basket - Current users's basket
 * @param {dw.campaign.DiscountPlan} discountPlan - set of applicable discounts
 */
function CartModel(basket) {
    base.call(this, basket);

    this.canMakeInstantPurchase = isEligibleForInstantPurchase(customer);
    this.browser = getBrowser();
}

module.exports = CartModel;
