Feature: WEB SDK Checkout | Guest - ERROR Auth flows

@Guest_WebSDK_Amex_REFUSED_Error_3ds1-challenge-identified_Auth.
    Scenario: Guest_WebSDK_Amex_REFUSED_Error_3ds1-challenge-identified_Auth. | 3DS error Flow
    	Given Shopper is on home page and selects yes for tracking consent
		Then Shopper searches for "Hammered Gold Earrings" and naviagtes to PDP
		Then Shopper add the product to cart and click to Checkout
		Then Shopper clicks on checkout as guest and navigates to shipping page
		Then Shopper enters "UnitedStates" shipping address
		And clicks on NextPayment button to navigate to payment section 
		Then Shopper enters "UnitedStates" billing address 
		And Shopper fills email and phone number on payment section
			|email|phoneno|
			|achpay1@yopmail.com|(33) 1 43 12 48 65|
		And Shopper adds payment details on websdk payment form
			|Name on Card |Card Number |Expiry|CVV|
			|REFUSED|343434343434343|01/24|0124|
		Then Refused error message is displayed
		And Shopper adds payment details on websdk payment form
		|Name on Card |Card Number |Expiry|CVV|
		|3ds1-challenge-identified|343434343434343|01/24|0124|
		Then Shopper clicks on Next Review Order Button to navigate to order review page
		Then Shopper clicks on Place Order Button
		Then Shopper clicks on Challenge OK Button and navigates to order confirmation page
		And log the order and payment details
		|Guest_WebSDK_Amex_REFUSED_Error_3ds1-challenge-identified_Auth.|

@Guest_WebSDK_Master_ERROR_Error_3ds2-frictionless-identified_Auth.
    Scenario: Guest_WebSDK_Master_ERROR_Error_3ds2-frictionless-identified_Auth. | 3DS error auth Flow
    	Given Shopper is on home page and selects yes for tracking consent
		Then Shopper searches for "Hammered Gold Earrings" and naviagtes to PDP
		Then Shopper add the product to cart and click to Checkout
		Then Shopper clicks on checkout as guest and navigates to shipping page
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
		Then Shopper clicks on Next Review Order Button to navigate to order review page
		Then Shopper clicks on Place Order Button
		And log the order and payment details
		|Guest_WebSDK_Master_ERROR_Error_3ds2-frictionless-identified_Auth.|

@Guest_WebSDK_Visa_REFUSED_ERROR
    Scenario: Guest_WebSDK_Visa_REFUSED_ERROR | 3DS error Flow
    	Given Shopper is on home page and selects yes for tracking consent
		Then Shopper searches for "Hammered Gold Earrings" and naviagtes to PDP
		Then Shopper add the product to cart and click to Checkout
		Then Shopper clicks on checkout as guest and navigates to shipping page
		Then Shopper enters "UnitedStates" shipping address
		And clicks on NextPayment button to navigate to payment section 
		Then Shopper enters "UnitedStates" billing address 
		And Shopper fills email and phone number on payment section
			|email|phoneno|
			|achpay1@yopmail.com|(33) 1 43 12 48 65|
		And Shopper adds payment details on websdk payment form
			|Name on Card |Card Number |Expiry|CVV|
			|REFUSED|4444333322221111|01/24|124|
		And Shopper adds payment details on websdk payment form
			|Name on Card |Card Number |Expiry|CVV|
			|ERROR|4444333322221111|01/24|124|
		Then Error message is displayed

@Guest_WebSDK_VisaDebit_3ds1-challenge-unknown-identity_Error_3ds1-challenge-identified_Auth.
    Scenario: Guest_WebSDK_VisaDebit_3ds1-challenge-unknown-identity_Error_3ds1-challenge-identified_Auth. | 3DS error auth Flow
    	Given Shopper is on home page and selects yes for tracking consent
		Then Shopper searches for "Hammered Gold Earrings" and naviagtes to PDP
		Then Shopper add the product to cart and click to Checkout
		Then Shopper clicks on checkout as guest and navigates to shipping page
		Then Shopper enters "UnitedStates" shipping address
		And clicks on NextPayment button to navigate to payment section 
		Then Shopper enters "UnitedStates" billing address 
		And Shopper fills email and phone number on payment section
			|email|phoneno|
			|achpay1@yopmail.com|(33) 1 43 12 48 65|
		And Shopper adds payment details on websdk payment form
			|Name on Card |Card Number |Expiry|CVV|
			|3ds1-challenge-unknown-identity|4462030000000000|01/24|124|
		Then Shopper clicks on Next Review Order Button to navigate to order review page
		Then Shopper clicks on Place Order Button
		Then Shopper clicks on Challenge OK Button and views the error message
		And Shopper adds payment details on websdk payment form
			|Name on Card |Card Number |Expiry|CVV|
			|3ds1-challenge-identified|4462030000000000|01/24|124|
		Then Shopper clicks on Next Review Order Button to navigate to order review page
		Then Shopper clicks on Place Order Button
		Then Shopper clicks on Challenge OK Button and navigates to order confirmation page
		And log the order and payment details
		|Guest_WebSDK_VisaDebit_3ds1-challenge-unknown-identity_Error_3ds1-challenge-identified_Auth.|

@Guest_WebSDK_MasterDebit_3ds2-frictionless-rejected_Error_3ds2-frictionless-unavailable_Auth.
    Scenario: Guest_WebSDK_MasterDebit_3ds2-frictionless-rejected_Error_3ds2-frictionless-unavailable_Auth. | 3DS error auth Flow
    	Given Shopper is on home page and selects yes for tracking consent
		Then Shopper searches for "Hammered Gold Earrings" and naviagtes to PDP
		Then Shopper add the product to cart and click to Checkout
		Then Shopper clicks on checkout as guest and navigates to shipping page
		Then Shopper enters "UnitedStates" shipping address
		And clicks on NextPayment button to navigate to payment section 
		Then Shopper enters "UnitedStates" billing address 
		And Shopper fills email and phone number on payment section
			|email|phoneno|
			|achpay1@yopmail.com|(33) 1 43 12 48 65|
		And Shopper adds payment details on websdk payment form
			|Name on Card |Card Number |Expiry|CVV|
			|3ds2-frictionless-rejected|5163613613613613|01/24|124|
		Then Shopper clicks on Next Review Order Button to navigate to order review page
		Then Shopper clicks on Place Order Button and views the error message
		And Shopper adds payment details on websdk payment form
			|Name on Card |Card Number |Expiry|CVV|
			|3ds2-frictionless-unavailable|5163613613613613|01/24|124|
		Then Shopper clicks on Next Review Order Button to navigate to order review page
		Then Shopper clicks on Place Order Button
		And log the order and payment details
		|Guest_WebSDK_MasterDebit_3ds2-frictionless-rejected_Error_3ds2-frictionless-unavailable_Auth.|
