Feature: Direct Checkout | Registered Disclaimer Yes Option - 3DS Flow

Background: User is logged in and make sure no payment is saved
		Given Shopper is on home page and selects yes for tracking consent
		Then Shopper clicks on login button and navigates to login page
		And Shopper enters the login credentials and clicks on Login Button
			|email|password|
			|awpauto@yopmail.com|Test@123|
		Then Go to MyAccount Page
		And make sure no payment is saved


@Reg._DisclaimerYes_Direct_Master_3ds1-challenge-identified_Auth.
    Scenario: Reg._DisclaimerYes_Direct_Master_3ds1-challenge-identified_Auth. | 3DS Challenge Flow
    	Then Shopper searches for "Hammered Gold Earrings" and naviagtes to PDP
		Then Shopper add the product to cart and click to Checkout
		Then Shopper enters "UnitedStates" shipping address
		And clicks on NextPayment button to navigate to payment section 
		Then Shopper enters "UnitedStates" billing address 
		And Shopper fills email and phone number on payment section
			|email|phoneno|
			|awpauto@yopmail.com|(33) 1 43 12 48 65|
		And Shopper adds payment details on direct card payment form
			|Name on Card |Card Number |ExpiryMonth|ExpryYear|CVV|
			|3ds1-challenge-identified|5555555555554444|02|2024|224|
		And selects Disclaimer Yes Option web
		Then Shopper clicks on Next Review Order Button to navigate to order review page
		Then Shopper clicks on Place Order Button
		Then Shopper clicks on Challenge OK Button and navigates to order confirmation page
		And log the order and payment details
		|Reg._DisclaimerYes_Direct_Master_3ds1-challenge-identified_Auth.|
		Then Go to MyAccount Page
		And Click on Payment View
		And Verify saved card details
		|Name on Card|Expiry|
		|3ds1-challenge-identified|2/2024|
		Then Shopper does a checkout with saved card  
		Then Shopper enters "UnitedStates" shipping address
		And clicks on NextPayment button to navigate to payment section 
		Then Shopper enters "UnitedStates" billing address 
		And Shopper fills email and phone number on payment section
		|email|phoneno|
		|awpauto@yopmail.com|(33) 1 43 12 48 65|
		And Shopper enters cvv for the Saved card
		|cvv|
		|545|
		Then verify that no Disclaimer is present
		Then Shopper clicks on Next Review Order Button to navigate to order review page
		Then Shopper clicks on Place Order Button
		Then Shopper clicks on Challenge OK Button and navigates to order confirmation page
		And log the order and payment details
		|Reg._DisclaimerYes_Direct_Master_3ds1-challenge-identified_Auth.|
		Then Go to MyAccount Page
		And Click on Payment View
		And Remove the Saved Payment 


@Reg._DisclaimerYes_Direct_VisaDebit_3ds2-challenge-identified_Auth.
    Scenario: Reg._DisclaimerYes_Direct_VisaDebit_3ds2-challenge-identified_Auth. | 3DS Challenge Flow
    	Then Shopper searches for "Hammered Gold Earrings" and naviagtes to PDP
		Then Shopper add the product to cart and click to Checkout
		Then Shopper enters "UnitedStates" shipping address
		And clicks on NextPayment button to navigate to payment section 
		Then Shopper enters "Canada" billing address 
		And Shopper fills email and phone number on payment section
			|email|phoneno|
			|achpay1@yopmail.com|(33) 1 43 12 48 65|
		And Shopper adds payment details on direct card payment form
			|Name on Card |Card Number |ExpiryMonth|ExpryYear|CVV|
			|3ds2-challenge-identified|4462030000000000|05|2024|524|
		And selects Disclaimer Yes Option web
		Then Shopper clicks on Next Review Order Button to navigate to order review page
		Then Shopper clicks on Place Order Button
		Then Shopper clicks on Challenge OK Button and navigates to order confirmation page
		And log the order and payment details
		|Reg._DisclaimerYes_Direct_VisaDebit_3ds2-challenge-identified_Auth.|
		Then Go to MyAccount Page
		And Click on Payment View
		And Verify saved card details
		|Name on Card|Expiry|
		|3ds2-challenge-identified|5/2024|
		Then Shopper does a checkout with saved card  
		Then Shopper enters "UnitedStates" shipping address
		And clicks on NextPayment button to navigate to payment section 
		Then Shopper enters "UnitedStates" billing address 
		And Shopper fills email and phone number on payment section
		|email|phoneno|
		|achpay1@yopmail.com|(33) 1 43 12 48 65|
		And Shopper enters cvv for the Saved card
		|cvv|
		|545|
		Then verify that no Disclaimer is present
		Then Shopper clicks on Next Review Order Button to navigate to order review page
		Then Shopper clicks on Place Order Button
		Then Shopper clicks on Challenge OK Button and navigates to order confirmation page
		And log the order and payment details
		|Reg._DisclaimerYes_Direct_VisaDebit_3ds2-challenge-identified_Auth.|
		Then Go to MyAccount Page
		And Click on Payment View
		And Remove the Saved Payment 

@Reg._DisclaimerYes_Direct_MasterDebit_3ds1-verification-unavailable_Auth.
    Scenario: Reg._DisclaimerYes_Direct_MasterDebit_3ds1-verification-unavailable_Auth. | 3DS Challenge Flow
    	Then Shopper searches for "Hammered Gold Earrings" and naviagtes to PDP
		Then Shopper add the product to cart and click to Checkout
		Then Shopper enters "Singapore" shipping address
		And clicks on NextPayment button to navigate to payment section 
		Then Shopper enters "Singapore" billing address 
		And Shopper fills email and phone number on payment section
			|email|phoneno|
			|newcode1newauto1@yopmail.com|(33) 1 43 12 48 65|
		And Shopper adds payment details on direct card payment form
			|Name on Card |Card Number |ExpiryMonth|ExpryYear|CVV|
			|3ds1-verification-unavailable|5163613613613613|04|2024|424|
		And selects Disclaimer Yes Option web
		Then Shopper clicks on Next Review Order Button to navigate to order review page
		Then Shopper clicks on Place Order Button
		Then Shopper clicks on Challenge OK Button and navigates to order confirmation page
		And log the order and payment details
		|Reg._DisclaimerYes_Direct_MasterDebit_Visa_3ds1-verification-unavailable_Auth.|
		Then Go to MyAccount Page
		And Click on Payment View
		And Verify saved card details
		|Name on Card|Expiry|
		|3ds1-verification-unavailable|4/2024|
		Then Shopper does a checkout with saved card  
		Then Shopper enters "UnitedStates" shipping address
		And clicks on NextPayment button to navigate to payment section 
		Then Shopper enters "UnitedStates" billing address 
		And Shopper fills email and phone number on payment section
		|email|phoneno|
		|newcode1newauto1@yopmail.com|(33) 1 43 12 48 65|
		And Shopper enters cvv for the Saved card
		|cvv|
		|545|
		Then verify that no Disclaimer is present
		Then Shopper clicks on Next Review Order Button to navigate to order review page
		Then Shopper clicks on Place Order Button
		Then Shopper clicks on Challenge OK Button and navigates to order confirmation page
		And log the order and payment details
		|Reg._DisclaimerYes_Direct_MasterDebit_Visa_3ds1-verification-unavailable_Auth.|
		Then Go to MyAccount Page
		And Click on Payment View
		And Remove the Saved Payment 


@Reg._DisclaimerYes_Direct_Amex_3ds1-bypassed_Auth.
    Scenario: Reg._DisclaimerYes_Direct_Amex_3ds1-bypassed_Auth. | 3DS NoChallenge Flow
    	Then Shopper searches for "Hammered Gold Earrings" and naviagtes to PDP
		Then Shopper add the product to cart and click to Checkout
		Then Shopper enters "UnitedStates" shipping address
		And clicks on NextPayment button to navigate to payment section 
		Then Shopper enters "UnitedStates" billing address 
		And Shopper fills email and phone number on payment section
			|email|phoneno|
			|awpauto@yopmail.com|(33) 1 43 12 48 65|
		And Shopper adds payment details on direct card payment form
			|Name on Card |Card Number |ExpiryMonth|ExpryYear|CVV|
			|3ds1-bypassed|343434343434343|01|2024|0124|
		And selects Disclaimer Yes Option web
		Then Shopper clicks on Next Review Order Button to navigate to order review page
		Then Shopper clicks on Place Order Button
		And log the order and payment details
		|Reg._DisclaimerYes_Direct_Amex_3ds1-bypassed_Auth.|
		Then Go to MyAccount Page
		And Click on Payment View
		And Verify saved card details
		|Name on Card|Expiry|
		|3ds1-bypassed|1/2024|
		Then Shopper does a checkout with saved card  
		Then Shopper enters "UnitedStates" shipping address
		And clicks on NextPayment button to navigate to payment section 
		Then Shopper enters "UnitedStates" billing address 
		And Shopper fills email and phone number on payment section
		|email|phoneno|
		|awpauto@yopmail.com|(33) 1 43 12 48 65|
		And Shopper enters cvv for the Saved card
		|cvv|
		|5452|
		Then verify that no Disclaimer is present
		Then Shopper clicks on Next Review Order Button to navigate to order review page
		Then Shopper clicks on Place Order Button
		And log the order and payment details
		|Reg._DisclaimerYes_Direct_Amex_3ds1-bypassed_Auth.|
		Then Go to MyAccount Page
		And Click on Payment View
		And Remove the Saved Payment 

@Reg._DisclaimerYes_Direct_VisaElectron_3ds1-authentication-unavailable_Auth.
    Scenario: Reg._DisclaimerYes_Direct_VisaElectron_3ds1-authentication-unavailable_Auth. | 3DS NoChallenge Flow
    	Then Shopper searches for "Hammered Gold Earrings" and naviagtes to PDP
		Then Shopper add the product to cart and click to Checkout
		Then Shopper enters "UnitedKingdom" shipping address
		And clicks on NextPayment button to navigate to payment section 
		Then Shopper enters "UnitedKingdom" billing address 
		And Shopper fills email and phone number on payment section
			|email|phoneno|
			|newcode1newauto1@yopmail.com|(33) 1 43 12 48 65|
		And Shopper adds payment details on direct card payment form
			|Name on Card |Card Number |ExpiryMonth|ExpryYear|CVV|
			|3ds1-authentication-unavailable|4917300800000000|03|2024|324|
		And selects Disclaimer Yes Option web
		Then Shopper clicks on Next Review Order Button to navigate to order review page
		Then Shopper clicks on Place Order Button
		And log the order and payment details
		|Reg._DisclaimerYes_Direct_VisaElectron_3ds1-authentication-unavailable_Auth.|
		Then Go to MyAccount Page
		And Click on Payment View
		And Verify saved card details
		|Name on Card|Expiry|
		|3ds1-authentication-unavailable|3/2024|
		Then Shopper does a checkout with saved card  
		Then Shopper enters "UnitedKingdom" shipping address
		And clicks on NextPayment button to navigate to payment section 
		Then Shopper enters "UnitedKingdom" billing address 
		And Shopper fills email and phone number on payment section
		|email|phoneno|
		|newcode1newauto1@yopmail.com|(33) 1 43 12 48 65|
		And Shopper enters cvv for the Saved card
		|cvv|
		|545|
		Then verify that no Disclaimer is present
		Then Shopper clicks on Next Review Order Button to navigate to order review page
		Then Shopper clicks on Place Order Button
		And log the order and payment details
		|Reg._DisclaimerYes_Direct_Visa_3ds1-authentication-unavailable_Auth.|
		Then Go to MyAccount Page
		And Click on Payment View
		And Remove the Saved Payment 

@Reg._DisclaimerYes_Direct_Visa_3ds2-frictionless-identified_Auth.
    Scenario: Reg._DisclaimerYes_Direct_Visa_3ds2-frictionless-identified_Auth. | 3DS NoChallenge Flow
    	Then Shopper searches for "Hammered Gold Earrings" and naviagtes to PDP
		Then Shopper add the product to cart and click to Checkout
		Then Shopper enters "Singapore" shipping address
		And clicks on NextPayment button to navigate to payment section 
		Then Shopper enters "Singapore" billing address 
		And Shopper fills email and phone number on payment section
			|email|phoneno|
			|awpauto@yopmail.com|(33) 1 43 12 48 65|
		And Shopper adds payment details on direct card payment form
			|Name on Card |Card Number |ExpiryMonth|ExpryYear|CVV|
			|3ds2-frictionless-identified|4444333322221111|04|2024|424|
		And selects Disclaimer Yes Option web
		Then Shopper clicks on Next Review Order Button to navigate to order review page
		Then Shopper clicks on Place Order Button
		And log the order and payment details
		|Reg._DisclaimerYes_Direct_MasterDebit_Visa_3ds2-frictionless-identified_Auth.|
		Then Go to MyAccount Page
		And Click on Payment View
		And Verify saved card details
		|Name on Card|Expiry|
		|3ds2-frictionless-identified|4/2024|
		Then Shopper does a checkout with saved card  
		Then Shopper enters "UnitedStates" shipping address
		And clicks on NextPayment button to navigate to payment section 
		Then Shopper enters "UnitedStates" billing address 
		And Shopper fills email and phone number on payment section
		|email|phoneno|
		|awpauto@yopmail.com|(33) 1 43 12 48 65|
		And Shopper enters cvv for the Saved card
		|cvv|
		|545|
		Then verify that no Disclaimer is present
		Then Shopper clicks on Next Review Order Button to navigate to order review page
		Then Shopper clicks on Place Order Button
		And log the order and payment details
		|Reg._DisclaimerYes_Direct_Visa_3ds2-frictionless-identified_Auth.|
		Then Go to MyAccount Page
		And Click on Payment View
		And Remove the Saved Payment 

@Reg._DisclaimerYes_Direct_VisaPurchasing_3ds2-frictionless-not-identified_Auth.
    Scenario: Reg._DisclaimerYes_Direct_VisaPurchasing_3ds2-frictionless-not-identified_Auth. | 3DS NoChallenge Flow
    	Then Shopper searches for "Hammered Gold Earrings" and naviagtes to PDP
		Then Shopper add the product to cart and click to Checkout
		Then Shopper enters "Germany" shipping address
		And clicks on NextPayment button to navigate to payment section 
		Then Shopper enters "Germany" billing address 
		And Shopper fills email and phone number on payment section
			|email|phoneno|
			|achpay1@yopmail.com|(33) 1 43 12 48 65|
		And Shopper adds payment details on direct card payment form
			|Name on Card |Card Number |ExpiryMonth|ExpryYear|CVV|
			|3ds2-frictionless-not-identified|4484070000000000|05|2024|524|
		And selects Disclaimer Yes Option web
		Then Shopper clicks on Next Review Order Button to navigate to order review page
		Then Shopper clicks on Place Order Button
		And log the order and payment details
		|Reg._DisclaimerYes_Direct_VisaPurchasing_3ds2-frictionless-not-identified_Auth.|
		Then Go to MyAccount Page
		And Click on Payment View
		And Verify saved card details
		|Name on Card|Expiry|
		|3ds2-frictionless-not-identified|5/2024|
		Then Shopper does a checkout with saved card  
		Then Shopper enters "Germany" shipping address
		And clicks on NextPayment button to navigate to payment section 
		Then Shopper enters "Germany" billing address 
		And Shopper fills email and phone number on payment section
		|email|phoneno|
		|achpay1@yopmail.com|(33) 1 43 12 48 65|
		And Shopper enters cvv for the Saved card
		|cvv|
		|545|
		Then verify that no Disclaimer is present
		Then Shopper clicks on Next Review Order Button to navigate to order review page
		Then Shopper clicks on Place Order Button
		And log the order and payment details
		|Reg._DisclaimerYes_Direct_VisaPurchasing_3ds2-frictionless-not-identified_Auth.|
		Then Go to MyAccount Page
		And Click on Payment View
		And Remove the Saved Payment 