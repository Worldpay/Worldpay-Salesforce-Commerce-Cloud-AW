'use strict';

var Registry = {
    authToken: function () {
        var AuthToken = require('*/cartridge/scripts/models/authToken');
        return new AuthToken();
    }
};

module.exports = Registry;
