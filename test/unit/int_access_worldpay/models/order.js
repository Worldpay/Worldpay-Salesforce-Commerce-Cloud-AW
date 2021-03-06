'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var mockSuperModule = require('../../../mockModuleSuperModule');
var baseOrderModelMock = require('../../../mocks/models/baseOrder');

var OrderModel;

describe('OrderModel confirmationstatus Property', function () {

	before(function () {
        mockSuperModule.create(baseOrderModelMock);
        OrderModel = proxyquire('../../../../cartridges/int_access_worldpay_sfra/cartridge/models/order',
            {
                'dw/web/Resource': {
                    msgf: function (params) {
                        return params;
                    },
                    msg: function (params) {
                        return params;
                    }
                },
                'dw/order/OrderMgr': {
                    getOrder: function () {
                        return {order: 'returned order'};
                    }
                }
            });
    });

    after(function () {
        mockSuperModule.remove();
    });

    it('should return true for confirmationStatus property ', function () {
        var options = {
            config: {
                numberOfLineItems: 'single'
            }
        };
        var lineItemContainer = {
            confirmationStatus: true
        };
        var result = new OrderModel(lineItemContainer, options);
        assert.equal(result.confirmationStatus, true);
    });
});
