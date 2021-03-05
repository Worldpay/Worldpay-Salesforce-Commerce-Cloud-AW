Feature: WEB SDK Checkout | Guest - 3DS Challenge Flow

@Guest_WebSDK_Amex_AUTHORISED_Auth.
    Scenario: Guest_WebSDK_Amex_AUTHORISED_Auth. | 3DS Challenge Flow
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
			|AUTHORISED|343434343434343|01/24|0124|
		Then Shopper clicks on Next Review Order Button to navigate to order review page
		Then Shopper clicks on Place Order Button
		Then Shopper clicks on Challenge OK Button and navigates to order confirmation page
		And log the order and payment details
		|Guest_WebSDK_Amex_AUTHORISED_Auth.|

@Guest_WebSDK_Master_3ds1-challenge-identified_Auth.
    Scenario: Guest_WebSDK_Master_3ds1-challenge-identified_Auth. | 3DS Challenge Flow
    	Given Shopper is on home page and selects yes for tracking consent
		Then Shopper searches for "Hammered Gold Earrings" and naviagtes to PDP
		Then Shopper add the product to cart and click to Checkout
		Then Shopper clicks on checkout as guest and navigates to shipping page
		Then Shopper enters "UnitedStates" shipping address
		And clicks on NextPayment button to navigate to payment section 
		Then Shopper enters "UnitedStates" billing address 
		And Shopper fills email and phone number on payment section
			|email|phoneno|
			|autoawp@yopmail.com|(33) 1 43 12 48 65|
		And Shopper adds payment details on websdk payment form
			|Name on Card |Card Number |Expiry|CVV|
			|3ds1-challenge-identified|5555555555554444|02/24|224|
		Then Shopper clicks on Next Review Order Button to navigate to order review page
		Then Shopper clicks on Place Order Button
		Then Shopper clicks on Challenge OK Button and navigates to order confirmation page
		And log the order and payment details
		|Guest_WebSDK_Master_3ds1-challenge-identified_Auth.|

@Guest_WebSDK_Visa_3ds1-challenge-not-identified_Auth.
    Scenario: Guest_WebSDK_Visa_3ds1-challenge-not-identified_Auth. | 3DS Challenge Flow
    	Given Shopper is on home page and selects yes for tracking consent
		Then Shopper searches for "Hammered Gold Earrings" and naviagtes to PDP
		Then Shopper add the product to cart and click to Checkout
		Then Shopper clicks on checkout as guest and navigates to shipping page
		Then Shopper enters "UnitedKingdom" shipping address
		And clicks on NextPayment button to navigate to payment section 
		Then Shopper enters "UnitedKingdom" billing address 
		And Shopper fills email and phone number on payment section
			|email|phoneno|
			|achpay1@yopmail.com|(33) 1 43 12 48 65|
		And Shopper adds payment details on websdk payment form
			|Name on Card |Card Number |Expiry|CVV|
			|3ds1-challenge-not-identified|4444333322221111|03/24|324|
		Then Shopper clicks on Next Review Order Button to navigate to order review page
		Then Shopper clicks on Place Order Button
		Then Shopper clicks on Challenge OK Button and navigates to order confirmation page
		And log the order and payment details
		|Guest_WebSDK_Visa_3ds1-challenge-not-identified_Auth.|

@Guest_WebSDK_MasterDebit_3ds1-verification-unavailable_Auth.
    Scenario: Guest_WebSDK_MasterDebit_3ds1-verification-unavailable_Auth. | 3DS Challenge Flow
    	Given Shopper is on home page and selects yes for tracking consent
		Then Shopper searches for "Hammered Gold Earrings" and naviagtes to PDP
		Then Shopper add the product to cart and click to Checkout
		Then Shopper clicks on checkout as guest and navigates to shipping page
		Then Shopper enters "Singapore" shipping address
		And clicks on NextPayment button to navigate to payment section 
		Then Shopper enters "Singapore" billing address 
		And Shopper fills email and phone number on payment section
			|email|phoneno|
			|autoawp@yopmail.com|(33) 1 43 12 48 65|
		And Shopper adds payment details on websdk payment form
			|Name on Card |Card Number |Expiry|CVV|
			|3ds1-verification-unavailable|5163613613613613|04/24|424|
		Then Shopper clicks on Next Review Order Button to navigate to order review page
		Then Shopper clicks on Place Order Button
		Then Shopper clicks on Challenge OK Button and navigates to order confirmation page
		And log the order and payment details
		|Guest_WebSDK_MasterDebit_Visa_3ds1-verification-unavailable_Auth.|

@Guest_WebSDK_VisaDebit_3ds2-challenge-identified_Auth.
    Scenario: Guest_WebSDK_VisaDebit_3ds2-challenge-identified_Auth. | 3DS Challenge Flow
    	Given Shopper is on home page and selects yes for tracking consent
		Then Shopper searches for "Hammered Gold Earrings" and naviagtes to PDP
		Then Shopper add the product to cart and click to Checkout
		Then Shopper clicks on checkout as guest and navigates to shipping page
		Then Shopper enters "UnitedStates" shipping address
		And clicks on NextPayment button to navigate to payment section 
		Then Shopper enters "Canada" billing address 
		And Shopper fills email and phone number on payment section
			|email|phoneno|
			|autoawp@yopmail.com|(33) 1 43 12 48 65|
		And Shopper adds payment details on websdk payment form
			|Name on Card |Card Number |Expiry|CVV|
			|3ds2-challenge-identified|4462030000000000|05/24|524|
		Then Shopper clicks on Next Review Order Button to navigate to order review page
		Then Shopper clicks on Place Order Button
		Then Shopper clicks on Challenge OK Button and navigates to order confirmation page
		And log the order and payment details
		|Guest_WebSDK_VisaDebit_3ds2-challenge-identified_Auth.|

@Guest_WebSDK_VisaPurchasing_3ds2-verification-unavailable_Auth.
    Scenario: Guest_WebSDK_VisaPurchasing_3ds2-verification-unavailable_Auth. | 3DS Challenge Flow
    	Given Shopper is on home page and selects yes for tracking consent
		Then Shopper searches for "Hammered Gold Earrings" and naviagtes to PDP
		Then Shopper add the product to cart and click to Checkout
		Then Shopper clicks on checkout as guest and navigates to shipping page
		Then Shopper enters "France" shipping address
		And clicks on NextPayment button to navigate to payment section 
		Then Shopper enters "France" billing address 
		And Shopper fills email and phone number on payment section
			|email|phoneno|
			|newautoawp@yopmail.com|(33) 1 43 12 48 65|
		And Shopper adds payment details on websdk payment form
			|Name on Card |Card Number |Expiry|CVV|
			|3ds2-verification-unavailable|4484070000000000|06/24|624|
		Then Shopper clicks on Next Review Order Button to navigate to order review page
		Then Shopper clicks on Place Order Button
		Then Shopper clicks on Challenge OK Button and navigates to order confirmation page
		And log the order and payment details
		|Guest_WebSDK_VisaPurchasing_3ds2-verification-unavailable_Auth.|

@Guest_WebSDK_VisaElectron_3ds2-bypassed-after-challenge_Auth.
    Scenario: Guest_WebSDK_VisaElectron_3ds2-bypassed-after-challenge_Auth. | 3DS Challenge Flow
    	Given Shopper is on home page and selects yes for tracking consent
		Then Shopper searches for "Hammered Gold Earrings" and naviagtes to PDP
		Then Shopper add the product to cart and click to Checkout
		Then Shopper clicks on checkout as guest and navigates to shipping page
		Then Shopper enters "UnitedKingdom" shipping address
		And clicks on NextPayment button to navigate to payment section 
		Then Shopper enters "UnitedKingdom" billing address 
		And Shopper fills email and phone number on payment section
			|email|phoneno|
			|autoawp@yopmail.com|(33) 1 43 12 48 65|
		And Shopper adds payment details on websdk payment form
			|Name on Card |Card Number |Expiry|CVV|
			|3ds2-bypassed-after-challenge|4917300800000000|07/24|724|
		Then Shopper clicks on Next Review Order Button to navigate to order review page
		Then Shopper clicks on Place Order Button
		Then Shopper clicks on Challenge OK Button and navigates to order confirmation page
		And log the order and payment details
		|Guest_WebSDK_VisaElectron_3ds2-bypassed-after-challenge_Auth.|
