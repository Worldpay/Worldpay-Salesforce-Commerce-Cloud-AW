Feature: Direct Checkout | Guest - ERROR Auth flows

@Guest_Direct_VisaDebit_3ds1-challenge-unknown-identity_Error_3ds1-challenge-identified_Auth.
    Scenario: Guest_Direct_VisaDebit_3ds1-challenge-unknown-identity_Error_3ds1-challenge-identified_Auth. | 3DS error auth Flow
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
		And Shopper adds payment details on direct card payment form
			|Name on Card |Card Number |ExpiryMonth|ExpryYear|CVV|
			|3ds1-challenge-unknown-identity|4462030000000000|01|2024|124|
		Then Shopper clicks on Next Review Order Button to navigate to order review page
		Then Shopper clicks on Place Order Button
		Then Shopper clicks on Challenge OK Button and views the error message
		And Shopper adds payment details on direct card payment form
			|Name on Card |Card Number |ExpiryMonth|ExpryYear|CVV|
			|3ds1-challenge-identified|4462030000000000|01|2024|124|
		Then Shopper clicks on Next Review Order Button to navigate to order review page
		Then Shopper clicks on Place Order Button
		Then Shopper clicks on Challenge OK Button and navigates to order confirmation page
		And log the order and payment details
		|Guest_Direct_VisaDebit_3ds1-challenge-unknown-identity_Error_3ds1-challenge-identified_Auth.|

@Guest_Direct_MasterDebit_3ds2-frictionless-rejected_Error_3ds2-frictionless-unavailable_Auth.
    Scenario: Guest_Direct_MasterDebit_3ds2-frictionless-rejected_Error_3ds2-frictionless-unavailable_Auth. | 3DS error auth Flow
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
		And Shopper adds payment details on direct card payment form
			|Name on Card |Card Number |ExpiryMonth|ExpryYear|CVV|
			|3ds2-frictionless-rejected|5163613613613613|01|2024|124|
		Then Shopper clicks on Next Review Order Button to navigate to order review page
		Then Shopper clicks on Place Order Button and views the error message
		And Shopper adds payment details on direct card payment form
			|Name on Card |Card Number |ExpiryMonth|ExpryYear|CVV|
			|3ds2-frictionless-unavailable|5163613613613613|01|2024|124|
		Then Shopper clicks on Next Review Order Button to navigate to order review page
		Then Shopper clicks on Place Order Button
		And log the order and payment details
		|Guest_Direct_MasterDebit_3ds2-frictionless-rejected_Error_3ds2-frictionless-unavailable_Auth.|
