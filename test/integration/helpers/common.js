var path = require('path');
require('shelljs/make');

function getSandboxUrl() {
    if (test('-f', path.join(process.cwd(), 'dw.json'))) {
        var config = cat(path.join(process.cwd(), 'dw.json'));
        var parsedConfig = JSON.parse(config);
        return '' + parsedConfig.hostname;
    }
    return '';
}

function common() {}

common.variantId = 'sony-kdl-32m4000M';
common.loginDetails = {
    loginId: 'test@worldpay.com',
    password: 'Worldpay@123'
};

common.ocapiUrl = 'https://' + getSandboxUrl() + '/s/RefArch/dw/shop/v19_1';

common.amex = {
    cardName: 'AMEX-SSL',
    cardType: 'AMEX',
    cardOwner: 'test',
    number: '343434343434343',
    yearIndex: 2025,
    monthIndex: 1,
    cvn: 1234
};

common.creditCardVisa = {
    cardName: 'VISA-SSL',
    cardType: 'Visa',
    cardOwner: 'test',
    number: '4917610000000000',
    yearIndex: 2025,
    monthIndex: 1,
    cvn: 987
};
common.creditCardVisa2 = {
    cardName: 'VISA-SSL',
    cardType: 'Visa',
    cardOwner: 'test',
    number: '4111111111111111',
    yearIndex: 2025,
    monthIndex: 1,
    cvn: 987
};
common.creditCard3D = {
    cardName: 'VISA-SSL',
    cardType: 'Visa',
    cardOwner: '3D',
    number: '4111111111111111',
    yearIndex: 2025,
    monthIndex: 1,
    cvn: 987
};
common.shippingAddress = {
    firstName: 'Ramesh',
    lastName: 'Vanka',
    address1: '10 main Street',
    address2: '',
    country: 'US',
    stateCode: 'NY',
    city: 'burlington',
    postalCode: '14304',
    phone: '3333333333'
};
common.billingAddress = {
    firstName: 'Ramesh',
    lastName: 'Vanka',
    address1: '10 main Street',
    address2: '',
    country: 'US', // United States
    stateCode: 'NY',
    city: 'burlington',
    postalCode: '14304',
    email: 'jnishikant@sapient.com',
    phone: '3333333333'
};

module.exports = common;
