function common() {}

common.variantId = '008884303989M';
common.loginDetails = {
    loginId: 'rammi18g@gmail.com',
    password: 'Rammi@18g'
};

common.ocapiUrl = 'https://worldpay01-tech-prtnr-eu04-dw.demandware.net/s/Sites-RefArchAWP-Site/dw/shop/v19_1';

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
