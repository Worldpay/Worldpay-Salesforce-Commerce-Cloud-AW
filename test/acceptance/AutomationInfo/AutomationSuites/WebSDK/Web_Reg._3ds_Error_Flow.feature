Feature: WEB SDK Checkout | Registered - ERROR Auth flows

Background: User is logged in and make sure no payment is saved
		Given Shopper is on home page and selects yes for tracking consent
		Then Shopper clicks on login button and navigates to login page
		And Shopper enters the login credentials and clicks on Login Button
			|email|password|
			|autoawp@yopmail.com|Test@123|
		Then Go to MyAccount Page
		And make sure no payment is saved

@Registered_WebSDK_Amex_REFUSED_Error_3ds1-challenge-identified_Auth.
    Scenario: Registered_WebSDK_Amex_REFUSED_Error_3ds1-challenge-identified_Auth. | 3DS error Flow
    	Then Shopper searches for "Hammered Gold Earrings" and naviagtes to PDP
		Then Shopper add the product to cart and click to Checkout
		Then Shopper enters "UnitedStates" shipping address
		And clicks on NextPayment button to navigate to payment section 
		Then Shopper enters "UnitedStates" billing address 
		And Shopper fills email and phone number on payment section
			|email|phoneno|
			|autoawp@yopmail.com|(33) 1 43 12 48 65|
		And Shopper adds payment details on websdk payment form
			|Name on Card |Card Number |Expiry|CVV|
			|REFUSED75|343434343434343|01/24|0124|
		Then Refused error message is displayed
		And Shopper adds payment details on websdk payment form
		|Name on Card |Card Number |Expiry|CVV|
		|3ds1-challenge-identified|343434343434343|01/24|0124|
		And selects Disclaimer Yes Option web
		Then Shopper clicks on Next Review Order Button to navigate to order review page
		Then Shopper clicks on Place Order Button
		Then Shopper clicks on Challenge OK Button and navigates to order confirmation page
		And log the order and payment details
		|Registered_WebSDK_Amex_REFUSED_Error_3ds1-challenge-identified_Auth.|
		Then Go to MyAccount Page
		And Click on Payment View
		And Remove the Saved Payment 

@Registered_WebSDK_Master_ERROR_Error_3ds2-frictionless-identified_Auth.
    Scenario: Registered_WebSDK_Master_ERROR_Error_3ds2-frictionless-identified_Auth. | 3DS error auth Flow
    	Then Shopper searches for "Hammered Gold Earrings" and naviagtes to PDP
		Then Shopper add the product to cart and click to Checkout
		Then Shopper enters "UnitedStates" shipping address
		And clicks on NextPayment button to navigate to payment section 
		Then Shopper enters "UnitedStates" billing address 
		And Shopper fills email and phone number on payment section
			|email|phoneno|
			|newcode1newauto1@yopmail.com|(33) 1 43 12 48 65|
		And Shopper adds payment details on websdk payment form
			|Name on Card |Card Number |Expiry|CVV|
			|ERROR|5555555555554444|01/24|124|
		Then Error message is displayed
		And Shopper adds payment details on websdk payment form
		|Name on Card |Card Number |Expiry|CVV|
		|3ds2-frictionless-identified|5555555555554444|01/24|124|
		And selects Disclaimer No Option web
		Then Shopper clicks on Next Review Order Button to navigate to order review page
		Then Shopper clicks on Place Order Button
		And log the order and payment details
		|Registered_WebSDK_Master_ERROR_Error_3ds2-frictionless-identified_Auth.|
		Then Go to MyAccount Page
		And Verify no Payment Saved

@Registered_WebSDK_Visa_REFUSED_ERROR
    Scenario: Registered_WebSDK_Visa_REFUSED_ERROR | 3DS error Flow
    	Then Shopper searches for "Hammered Gold Earrings" and naviagtes to PDP
		Then Shopper add the product to cart and click to Checkout
		Then Shopper enters "UnitedStates" shipping address
		And clicks on NextPayment button to navigate to payment section 
		Then Shopper enters "UnitedStates" billing address 
		And Shopper fills email and phone number on payment section
			|email|phoneno|
			|achpay1@yopmail.com|(33) 1 43 12 48 65|
		And Shopper adds payment details on websdk payment form
			|Name on Card |Card Number |Expiry|CVV|
			|ERROR|4444333322221111|01/24|124|
		Then Error message is displayed
		And Shopper adds payment details on websdk payment form
			|Name on Card |Card Number |Expiry|CVV|
			|REFUSED33|4444333322221111|01/24|124|
		Then Refused error message is displayed

@Registered_WebSDK_VisaElectron_3ds1-challenge-unknown-identity_Error_3ds1-challenge-identified_Auth.
    Scenario: Registered_WebSDK_VisaElectron_3ds1-challenge-unknown-identity_Error_3ds1-challenge-identified_Auth. | 3DS error auth Flow
    	Then Shopper searches for "Hammered Gold Earrings" and naviagtes to PDP
		Then Shopper add the product to cart and click to Checkout
		Then Shopper enters "UnitedKingdom" shipping address
		And clicks on NextPayment button to navigate to payment section 
		Then Shopper enters "UnitedKingdom" billing address 
		And Shopper fills email and phone number on payment section
			|email|phoneno|
			|autoawp@yopmail.com|(33) 1 43 12 48 65|
		And Shopper adds payment details on websdk payment form
			|Name on Card |Card Number |Expiry|CVV|
			|3ds1-challenge-unknown-identity|4917300800000000|01/24|124|
			And selects Disclaimer Yes Option web
		Then Shopper clicks on Next Review Order Button to navigate to order review page
		Then Shopper clicks on Place Order Button
		Then Shopper clicks on Challenge OK Button and views the error message
		And Shopper adds payment details on websdk payment form
			|Name on Card |Card Number |Expiry|CVV|
			|3ds1-challenge-identified|4917300800000000|01/24|124|
		And selects Disclaimer Yes Option web
		Then Shopper clicks on Next Review Order Button to navigate to order review page
		Then Shopper clicks on Place Order Button
		Then Shopper clicks on Challenge OK Button and navigates to order confirmation page
		And log the order and payment details
		|Registered_WebSDK_VisaElectron_3ds1-challenge-unknown-identity_Error_3ds1-challenge-identified_Auth.|
		Then Go to MyAccount Page
		And Click on Payment View
		And Verify saved card details
		|Name on Card|Expiry|
		|3ds1-challenge-identified|1/2024|
		And Remove the Saved Payment

@Registered_WebSDK_VisaPurchasing_3ds2-frictionless-rejected_Error_3ds2-frictionless-unavailable_Auth.
    Scenario: Registered_WebSDK_VisaPurchasing_3ds2-frictionless-rejected_Error_3ds2-frictionless-unavailable_Auth. | 3DS error auth Flow
    	Then Shopper searches for "Hammered Gold Earrings" and naviagtes to PDP
		Then Shopper add the product to cart and click to Checkout
		Then Shopper enters "UnitedStates" shipping address
		And clicks on NextPayment button to navigate to payment section 
		Then Shopper enters "UnitedStates" billing address 
		And Shopper fills email and phone number on payment section
			|email|phoneno|
			|newcode1newauto1@yopmail.com|(33) 1 43 12 48 65|
		And Shopper adds payment details on websdk payment form
			|Name on Card |Card Number |Expiry|CVV|
			|3ds2-frictionless-rejected|4484070000000000|01/24|124|
		And selects Disclaimer No Option web
		Then Shopper clicks on Next Review Order Button to navigate to order review page
		Then Shopper clicks on Place Order Button and views the error message
		And Shopper adds payment details on websdk payment form
			|Name on Card |Card Number |Expiry|CVV|
			|3ds2-frictionless-unavailable|4484070000000000|01/24|124|
		And selects Disclaimer No Option web
		Then Shopper clicks on Next Review Order Button to navigate to order review page
		Then Shopper clicks on Place Order Button
		And log the order and payment details
		|Registered_WebSDK_VisaPurchasingt_3ds2-frictionless-rejected_Error_3ds2-frictionless-unavailable_Auth.|
		Then Go to MyAccount Page
		And Verify no Payment Saved