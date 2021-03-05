Feature: Direct Checkout | Registered - ERROR Auth flows

Background: User is logged in and make sure no payment is saved
		Given Shopper is on home page and selects yes for tracking consent
		Then Shopper clicks on login button and navigates to login page
		And Shopper enters the login credentials and clicks on Login Button
			|email|password|
			|awpauto@yopmail.com|Test@123|
		Then Go to MyAccount Page
		And make sure no payment is saved

@Registered_Direct_VisaElectron_3ds1-challenge-unknown-identity_Error_3ds1-challenge-identified_Auth.
    Scenario: Registered_Direct_VisaElectron_3ds1-challenge-unknown-identity_Error_3ds1-challenge-identified_Auth. | 3DS error auth Flow
    	Then Shopper searches for "Hammered Gold Earrings" and naviagtes to PDP
		Then Shopper add the product to cart and click to Checkout
		Then Shopper enters "UnitedKingdom" shipping address
		And clicks on NextPayment button to navigate to payment section 
		Then Shopper enters "UnitedKingdom" billing address 
		And Shopper fills email and phone number on payment section
			|email|phoneno|
			|awpauto@yopmail.com|(33) 1 43 12 48 65|
		And Shopper adds payment details on direct card payment form
			|Name on Card |Card Number |ExpiryMonth|ExpryYear|CVV|
			|3ds1-challenge-unknown-identity|4917300800000000|01|2024|124|
			And selects Disclaimer Yes Option web
		Then Shopper clicks on Next Review Order Button to navigate to order review page
		Then Shopper clicks on Place Order Button
		Then Shopper clicks on Challenge OK Button and views the error message
		And Shopper adds payment details on direct card payment form
			|Name on Card |Card Number |ExpiryMonth|ExpryYear|CVV|
			|3ds1-challenge-identified|4917300800000000|01|2024|124|
		And selects Disclaimer Yes Option web
		Then Shopper clicks on Next Review Order Button to navigate to order review page
		Then Shopper clicks on Place Order Button
		Then Shopper clicks on Challenge OK Button and navigates to order confirmation page
		And log the order and payment details
		|Registered_Direct_VisaElectron_3ds1-challenge-unknown-identity_Error_3ds1-challenge-identified_Auth.|
		Then Go to MyAccount Page
		And Click on Payment View
		And Verify saved card details
		|Name on Card|Expiry|
		|3ds1-challenge-identified|1/2024|
		And Remove the Saved Payment

@Registered_Direct_VisaPurchasing_3ds2-frictionless-rejected_Error_3ds2-frictionless-unavailable_Auth.
    Scenario: Registered_Direct_VisaPurchasing_3ds2-frictionless-rejected_Error_3ds2-frictionless-unavailable_Auth. | 3DS error auth Flow
    	Then Shopper searches for "Hammered Gold Earrings" and naviagtes to PDP
		Then Shopper add the product to cart and click to Checkout
		Then Shopper enters "UnitedStates" shipping address
		And clicks on NextPayment button to navigate to payment section 
		Then Shopper enters "UnitedStates" billing address 
		And Shopper fills email and phone number on payment section
			|email|phoneno|
			|newcode1newauto1@yopmail.com|(33) 1 43 12 48 65|
		And Shopper adds payment details on direct card payment form
			|Name on Card |Card Number |ExpiryMonth|ExpryYear|CVV|
			|3ds2-frictionless-rejected|4484070000000000|01|2024|124|
		And selects Disclaimer No Option web
		Then Shopper clicks on Next Review Order Button to navigate to order review page
		Then Shopper clicks on Place Order Button and views the error message
		And Shopper adds payment details on direct card payment form
			|Name on Card |Card Number |ExpiryMonth|ExpryYear|CVV|
			|3ds2-frictionless-unavailable|4484070000000000|01|2024|124|
		And selects Disclaimer No Option web
		Then Shopper clicks on Next Review Order Button to navigate to order review page
		Then Shopper clicks on Place Order Button
		And log the order and payment details
		|Registered_Direct_VisaPurchasingt_3ds2-frictionless-rejected_Error_3ds2-frictionless-unavailable_Auth.|
		Then Go to MyAccount Page
		And Verify no Payment Saved