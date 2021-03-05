Feature: Direct Card Checkout | Guest - 3DS NoChallenge Flow

@Guest_Direct_Amex_3ds1-bypassed_Auth.
    Scenario: Guest_Direct_Amex_3ds1-bypassed_Auth. | 3DS NoChallenge Flow
    	Given Shopper is on home page and selects yes for tracking consent
		Then Shopper searches for "Hammered Gold Earrings" and naviagtes to PDP
		Then Shopper add the product to cart and click to Checkout
		Then Shopper clicks on checkout as guest and navigates to shipping page
		Then Shopper enters "UnitedStates" shipping address
		And clicks on NextPayment button to navigate to payment section 
		Then Shopper enters "UnitedStates" billing address 
		And Shopper fills email and phone number on payment section
			|email|phoneno|
			|awpauto@yopmail.com|(33) 1 43 12 48 65|
		And Shopper adds payment details on direct card payment form
			|Name on Card |Card Number |ExpiryMonth|ExpryYear|CVV|
			|3ds1-bypassed|343434343434343|01|2024|0124|
		Then Shopper clicks on Next Review Order Button to navigate to order review page
		Then Shopper clicks on Place Order Button
		And log the order and payment details
		|Guest_Direct_Amex_3ds1-bypassed_Auth.|

@Guest_Direct_Master_3ds1-not-enrolled_Auth.
    Scenario: Guest_Direct_Master_3ds1-not-enrolled_Auth. | 3DS NoChallenge Flow
    	Given Shopper is on home page and selects yes for tracking consent
		Then Shopper searches for "Hammered Gold Earrings" and naviagtes to PDP
		Then Shopper add the product to cart and click to Checkout
		Then Shopper clicks on checkout as guest and navigates to shipping page
		Then Shopper enters "UnitedStates" shipping address
		And clicks on NextPayment button to navigate to payment section 
		Then Shopper enters "UnitedStates" billing address 
		And Shopper fills email and phone number on payment section
			|email|phoneno|
			|awpauto@yopmail.com|(33) 1 43 12 48 65|
		And Shopper adds payment details on direct card payment form
			|Name on Card |Card Number |ExpiryMonth|ExpryYear|CVV|
			|3ds1-not-enrolled|5555555555554444|02|2024|224|
		Then Shopper clicks on Next Review Order Button to navigate to order review page
		Then Shopper clicks on Place Order Button
		And log the order and payment details
		|Guest_Direct_Master_3ds1-not-enrolled_Auth.|

@Guest_Direct_Visa_3ds1-authentication-unavailable_Auth.
    Scenario: Guest_Direct_Visa_3ds1-authentication-unavailable_Auth. | 3DS NoChallenge Flow
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
		And Shopper adds payment details on direct card payment form
			|Name on Card |Card Number |ExpiryMonth|ExpryYear|CVV|
			|3ds1-authentication-unavailable|4444333322221111|03|2024|324|
		Then Shopper clicks on Next Review Order Button to navigate to order review page
		Then Shopper clicks on Place Order Button
		And log the order and payment details
		|Guest_Direct_Visa_3ds1-authentication-unavailable_Auth.|

@Guest_Direct_MasterDebit_3ds2-frictionless-identified_Auth.
    Scenario: Guest_Direct_MasterDebit_3ds2-frictionless-identified_Auth. | 3DS NoChallenge Flow
    	Given Shopper is on home page and selects yes for tracking consent
		Then Shopper searches for "Hammered Gold Earrings" and naviagtes to PDP
		Then Shopper add the product to cart and click to Checkout
		Then Shopper clicks on checkout as guest and navigates to shipping page
		Then Shopper enters "Singapore" shipping address
		And clicks on NextPayment button to navigate to payment section 
		Then Shopper enters "Singapore" billing address 
		And Shopper fills email and phone number on payment section
			|email|phoneno|
			|newcode1newauto1@yopmail.com|(33) 1 43 12 48 65|
		And Shopper adds payment details on direct card payment form
			|Name on Card |Card Number |ExpiryMonth|ExpryYear|CVV|
			|3ds2-frictionless-identified|5163613613613613|04|2024|424|
		Then Shopper clicks on Next Review Order Button to navigate to order review page
		Then Shopper clicks on Place Order Button
		And log the order and payment details
		|Guest_Direct_MasterDebit_Visa_3ds2-frictionless-identified_Auth.|

@Guest_Direct_VisaPurchasing_3ds2-frictionless-not-identified_Auth.
    Scenario: Guest_Direct_VisaPurchasing_3ds2-frictionless-not-identified_Auth. | 3DS NoChallenge Flow
    	Given Shopper is on home page and selects yes for tracking consent
		Then Shopper searches for "Hammered Gold Earrings" and naviagtes to PDP
		Then Shopper add the product to cart and click to Checkout
		Then Shopper clicks on checkout as guest and navigates to shipping page
		Then Shopper enters "France" shipping address
		And clicks on NextPayment button to navigate to payment section 
		Then Shopper enters "France" billing address 
		And Shopper fills email and phone number on payment section
			|email|phoneno|
			|awpauto@yopmail.com|(33) 1 43 12 48 65|
		And Shopper adds payment details on direct card payment form
			|Name on Card |Card Number |ExpiryMonth|ExpryYear|CVV|
			|3ds2-frictionless-not-identified|4484070000000000|05|2024|524|
		Then Shopper clicks on Next Review Order Button to navigate to order review page
		Then Shopper clicks on Place Order Button
		And log the order and payment details
		|Guest_Direct_VisaPurchasing_3ds2-frictionless-not-identified_Auth.|

@Guest_Direct_VisaElectron_3ds2-frictionless-unavailable_Auth.
    Scenario: Guest_Direct_VisaElectron_3ds2-frictionless-unavailable_Auth. | 3DS NoChallenge Flow
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
		And Shopper adds payment details on direct card payment form
			|Name on Card |Card Number |ExpiryMonth|ExpryYear|CVV|
			|3ds2-frictionless-unavailable|4917300800000000|06|2024|624|
		Then Shopper clicks on Next Review Order Button to navigate to order review page
		Then Shopper clicks on Place Order Button
		And log the order and payment details
		|Guest_Direct_VisaElectron_3ds2-frictionless-unavailable_Auth.|

@Guest_Direct_Master_3ds2-authentication-unavailable_Auth.
    Scenario: Guest_Direct_Master_3ds2-authentication-unavailable_Auth. | 3DS NoChallenge Flow
    	Given Shopper is on home page and selects yes for tracking consent
		Then Shopper searches for "Hammered Gold Earrings" and naviagtes to PDP
		Then Shopper add the product to cart and click to Checkout
		Then Shopper clicks on checkout as guest and navigates to shipping page
		Then Shopper enters "UnitedKingdom" shipping address
		And clicks on NextPayment button to navigate to payment section 
		Then Shopper enters "UnitedKingdom" billing address 
		And Shopper fills email and phone number on payment section
			|email|phoneno|
			|awpauto@yopmail.com|(33) 1 43 12 48 65|
		And Shopper adds payment details on direct card payment form
			|Name on Card |Card Number |ExpiryMonth|ExpryYear|CVV|
			|3ds2-authentication-unavailable|5454545454545454|07|2024|724|
		Then Shopper clicks on Next Review Order Button to navigate to order review page
		Then Shopper clicks on Place Order Button
		And log the order and payment details
		|Guest_Direct_Master_3ds2-authentication-unavailable_Auth.|

@Guest_Direct_Amex_3ds2-bypassed_Auth.
    Scenario: Guest_Direct_Amex_3ds2-bypassed_Auth. | 3DS NoChallenge Flow
    	Given Shopper is on home page and selects yes for tracking consent
		Then Shopper searches for "Hammered Gold Earrings" and naviagtes to PDP
		Then Shopper add the product to cart and click to Checkout
		Then Shopper clicks on checkout as guest and navigates to shipping page
		Then Shopper enters "UnitedKingdom" shipping address
		And clicks on NextPayment button to navigate to payment section 
		Then Shopper enters "UnitedKingdom" billing address 
		And Shopper fills email and phone number on payment section
			|email|phoneno|
			|awpauto@yopmail.com|(33) 1 43 12 48 65|
		And Shopper adds payment details on direct card payment form
			|Name on Card |Card Number |ExpiryMonth|ExpryYear|CVV|
			|3ds2-bypassed|343434343434343|08|2024|0824|
		Then Shopper clicks on Next Review Order Button to navigate to order review page
		Then Shopper clicks on Place Order Button
		And log the order and payment details
		|Guest_Direct_Amex_3ds2-bypassed_Auth.|
