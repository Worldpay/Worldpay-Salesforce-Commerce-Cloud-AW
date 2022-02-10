'use strict';
window.jQuery = window.$ = require('jquery');
var processInclude = require('base/util');

$(document).ready(function () {
    processInclude(require('./instantCheckout/instantCheckout'));
});
