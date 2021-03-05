Feature: WEB SDK Checkout | Registered Disclaimer No Option - 3DS Flow

Background: User is logged in and make sure no payment is saved
		Given Shopper is on home page and selects yes for tracking consent
		Then Shopper clicks on login button and navigates to login page
		And Shopper enters the login credentials and clicks on Login Button
			|email|password|
			|autoawp@yopmail.com|Test@123|
		Then Go to MyAccount Page
		And make sure no payment is saved

@Reg._DisclaimerNo_WebSDK_Visa_3ds1-challenge-not-identified_Auth.
    Scenario: Reg._DisclaimerNo_WebSDK_Visa_3ds1-challenge-not-identified_Auth. | 3DS Challenge Flow
    	Then Shopper searches for "Hammered Gold Earrings" and naviagtes to PDP
		Then Shopper add the product to cart and click to Checkout
		Then Shopper enters "UnitedKingdom" shipping address
		And clicks on NextPayment button to navigate to payment section 
		Then Shopper enters "UnitedKingdom" billing address 
		And Shopper fills email and phone number on payment section
			|email|phoneno|
			|achpay1@yopmail.com|(33) 1 43 12 48 65|
		And Shopper adds payment details on websdk payment form
			|Name on Card |Card Number |Expiry|CVV|
			|3ds1-challenge-not-identified|4444333322221111|03/24|324|
		And selects Disclaimer No Option web
		Then Shopper clicks on Next Review Order Button to navigate to order review page
		Then Shopper clicks on Place Order Button
		Then Shopper clicks on Challenge OK Button and navigates to order confirmation page
		And log the order and payment details
		|Reg._DisclaimerNo_WebSDK_Visa_3ds1-challenge-not-identified_Auth.|
		Then Go to MyAccount Page
		And Verify no Payment Saved

@Reg._DisclaimerNo_WebSDK_VisaPurchasing_3ds2-verification-unavailable_Auth.
    Scenario: Reg._DisclaimerNo_WebSDK_VisaPurchasing_3ds2-verification-unavailable_Auth. | 3DS Challenge Flow
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
			|3ds2-verification-unavailable|4484070000000000|06/24|624|
		And selects Disclaimer No Option web
		Then Shopper clicks on Next Review Order Button to navigate to order review page
		Then Shopper clicks on Place Order Button
		Then Shopper clicks on Challenge OK Button and navigates to order confirmation page
		And log the order and payment details
		|Reg._DisclaimerNo_WebSDK_VisaPurchasing_3ds2-verification-unavailable_Auth.|
		Then Go to MyAccount Page
		And Verify no Payment Saved

@Reg._DisclaimerNo_WebSDK_VisaElectron_3ds2-bypassed-after-challenge_Auth.
    Scenario: Reg._DisclaimerNo_WebSDK_VisaElectron_3ds2-bypassed-after-challenge_Auth. | 3DS Challenge Flow
    	Then Shopper searches for "Hammered Gold Earrings" and naviagtes to PDP
		Then Shopper add the product to cart and click to Checkout
		Then Shopper enters "UnitedKingdom" shipping address
		And clicks on NextPayment button to navigate to payment section 
		Then Shopper enters "UnitedKingdom" billing address 
		And Shopper fills email and phone number on payment section
			|email|phoneno|
			|newcode1newauto1@yopmail.com|(33) 1 43 12 48 65|
		And Shopper adds payment details on websdk payment form
			|Name on Card |Card Number |Expiry|CVV|
			|3ds2-bypassed-after-challenge|4917300800000000|07/24|724|
		And unchecks save card option
		Then Shopper clicks on Next Review Order Button to navigate to order review page
		Then Shopper clicks on Place Order Button
		Then Shopper clicks on Challenge OK Button and navigates to order confirmation page
		And log the order and payment details
		|Reg._DisclaimerNo_WebSDK_VisaElectron_3ds2-bypassed-after-challenge_Auth.|
		Then Go to MyAccount Page
		And Verify no Payment Saved


@Reg._DisclaimerNo_WebSDK_Master_3ds1-not-enrolled_Auth.
    Scenario: Reg._DisclaimerNo_WebSDK_Master_3ds1-not-enrolled_Auth. | 3DS NoChallenge Flow
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
			|3ds1-not-enrolled|5555555555554444|02/24|224|
		And unchecks save card option
		Then Shopper clicks on Next Review Order Button to navigate to order review page
		Then Shopper clicks on Place Order Button
		And log the order and payment details
		|Reg._DisclaimerNo_WebSDK_Master_3ds1-not-enrolled_Auth.|
		Then Go to MyAccount Page
		And Verify no Payment Saved

@Reg._DisclaimerNo_WebSDK_MasterDebit_3ds2-frictionless-unavailable_Auth.
    Scenario: Reg._DisclaimerNo_WebSDK_MasterDebit_3ds2-frictionless-unavailable_Auth. | 3DS NoChallenge Flow
    	Then Shopper searches for "Hammered Gold Earrings" and naviagtes to PDP
		Then Shopper add the product to cart and click to Checkout
		Then Shopper enters "UnitedKingdom" shipping address
		And clicks on NextPayment button to navigate to payment section 
		Then Shopper enters "UnitedKingdom" billing address 
		And Shopper fills email and phone number on payment section
			|email|phoneno|
			|achpay1@yopmail.com|(33) 1 43 12 48 65|
		And Shopper adds payment details on websdk payment form
			|Name on Card |Card Number |Expiry|CVV|
			|3ds2-frictionless-unavailable|5163613613613613|06/24|624|
		And selects Disclaimer No Option web
		Then Shopper clicks on Next Review Order Button to navigate to order review page
		Then Shopper clicks on Place Order Button
		And log the order and payment details
		|Reg._DisclaimerNo_WebSDK_MasterDebit_3ds2-frictionless-unavailable_Auth.|
		Then Go to MyAccount Page
		And Verify no Payment Saved

@Reg._DisclaimerNo_WebSDK_VisaDebit_3ds2-authentication-unavailable_Auth.
    Scenario: Reg._DisclaimerNo_WebSDK_VisaDebit_3ds2-authentication-unavailable_Auth. | 3DS NoChallenge Flow
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
			|3ds2-authentication-unavailable|4462030000000000|07/24|724|
		And unchecks save card option
		Then Shopper clicks on Next Review Order Button to navigate to order review page
		Then Shopper clicks on Place Order Button
		And log the order and payment details
		|Reg._DisclaimerNo_WebSDK_VisaDebit_3ds2-authentication-unavailable_Auth.|
		Then Go to MyAccount Page
		And Verify no Payment Saved

@Reg._DisclaimerNo_WebSDK_Amex_3ds2-bypassed_Auth.
    Scenario: Reg._DisclaimerNo_WebSDK_Amex_3ds2-bypassed_Auth. | 3DS NoChallenge Flow
    	Then Shopper searches for "Hammered Gold Earrings" and naviagtes to PDP
		Then Shopper add the product to cart and click to Checkout
		Then Shopper enters "UnitedKingdom" shipping address
		And clicks on NextPayment button to navigate to payment section 
		Then Shopper enters "UnitedKingdom" billing address 
		And Shopper fills email and phone number on payment section
			|email|phoneno|
			|newcode1newauto1@yopmail.com|(33) 1 43 12 48 65|
		And Shopper adds payment details on websdk payment form
			|Name on Card |Card Number |Expiry|CVV|
			|3ds2-bypassed|343434343434343|08/24|0824|
		And selects Disclaimer No Option web
		Then Shopper clicks on Next Review Order Button to navigate to order review page
		Then Shopper clicks on Place Order Button
		And log the order and payment details
		|Reg._DisclaimerNo_WebSDK_Amex_3ds2-bypassed_Auth.|
		Then Go to MyAccount Page
		And Verify no Payment Saved