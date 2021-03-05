'use strict';

/**
 * This method returns name of the Card configured for CREDIT_CARD in BM
 * corresponding worldpay cardType returned from service response
 * @param {string} worldPayCardType - worldPayCardType
 * @returns {string} - card name
 */
function getCardType(worldPayCardType) {
    var cardName;
    switch (worldPayCardType) {
        case 'VISA':
            cardName = 'Visa';
            break;
        case 'ECMC':
            cardName = 'MasterCard';
            break;
        case 'AMEX':
            cardName = 'Amex';
            break;
        case 'JCB':
            cardName = 'JCB';
            break;
        case 'MAESTRO':
            cardName = 'Maestro';
            break;
        case 'DINERS':
            cardName = 'DinersClub';
            break;
        case 'DISCOVER':
            cardName = 'Discover';
            break;
        default:
            cardName = 'card/masked';
            break;
    }
    return cardName;
}

module.exports = {
    getCardType: getCardType
};
