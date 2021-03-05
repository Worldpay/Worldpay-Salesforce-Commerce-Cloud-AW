'use strict';

const assert = require('chai').assert;
var sinon = require('sinon');
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var mockSuperModule = require('../../../../mockModuleSuperModule');
var baseCheckoutHelpersMock = require('../../../../../test/mocks/scripts/checkout/baseCheckoutHelpers');
var collections = require('../../../../../test/mocks/util/collections');
var renderTemplateHelper = require('../../../../../test/mocks/helpers/renderTemplateHelper');

describe('checkoutHelpers',function(){
	var checkoutHelpers;
	
	describe('placeOrder',function(){
		var setConfirmationStatusStub = sinon.stub();
        var setExportStatusStub = sinon.stub();
		var status = {
            OK: 0,
            ERROR: 1
        };
		var orderMgr = {
            createOrder: function () {
                return { order: 'new order' };
            },
            placeOrder: function () {
                return status.OK;
            },
            failOrder: function () {
                return { order: 'failed order' };
            }
        };
		var order = {
            setConfirmationStatus: setConfirmationStatusStub,
            setExportStatus: setExportStatusStub
        };
		
		
		before(function(){
			mockSuperModule.create(baseCheckoutHelpersMock);
			
			checkoutHelpers = proxyquire('../../../../../cartridges/int_access_worldpay_sfra/cartridge/scripts/checkout/checkoutHelpers',
			{
                'dw/system/Transaction': {
                    wrap: function (callback) {
                        callback.call(this);
                    },
                    begin: function () {},
                    commit: function () {}
                },
                'dw/order/OrderMgr': orderMgr,
                'dw/order/Order': order,
                'dw/system/Status': status,
                '*/cartridge/scripts/util/collections': collections,
				'*/cartridge/scripts/renderTemplateHelper': renderTemplateHelper
            });
		});//before
		
		after(function () {
           mockSuperModule.remove();
        });//after
		
		beforeEach(function () {
            setConfirmationStatusStub.reset();
            setExportStatusStub.reset();
        });//beforeEach
		
		
		it('Should return result with error = false when no exception ',function(){
			var result = checkoutHelpers.placeOrder(order);
			assert.isTrue(setConfirmationStatusStub.calledOnce);
            assert.isFalse(result.error);
		});
		
		it('should return result with error = true when exception is thrown', function () {
            var order = {}; 
            var result = checkoutHelpers.placeOrder(order);

            assert.isTrue(setConfirmationStatusStub.notCalled);
            assert.isTrue(result.error);
        });
		
	});//placeOrder
	
});//checkoutHelpers