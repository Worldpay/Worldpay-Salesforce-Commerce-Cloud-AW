Feature: WEB SDK Checkout | My Account - 3DS Flow 

Background: User is logged in and make sure no payment is saved
		Given Shopper is on home page and selects yes for tracking consent
		Then Shopper clicks on login button and navigates to login page
		And Shopper enters the login credentials and clicks on Login Button
			|email|password|
			|autoawp@yopmail.com|Test@123|
		Then Go to MyAccount Page
		And make sure no payment is saved


@Reg._MyAccount_WebSDK_Discover_3ds1-challenge-identified_Auth.
    Scenario: Reg._MyAccount_WebSDK_Discover_3ds1-challenge-identified_Auth. | 3DS Challenge Flow
    	Then Go to MyAccount Page
		Then Shopper adds payment details on account payment form
		|Name on Card |Card Number|ExpiryMonth|ExpryYear|
		|3ds1-challenge-identified|6011000400000000|02|2024|
		Then Shopper does a checkout with saved card  
		Then Shopper enters "UnitedStates" shipping address
		And clicks on NextPayment button to navigate to payment section 
		Then Shopper enters "UnitedStates" billing address 
		And Shopper fills email and phone number on payment section
		|email|phoneno|
		|autoawp@yopmail.com|(33) 1 43 12 48 65|
		Then verify that no Disclaimer is present
		Then Shopper clicks on Next Review Order Button to navigate to order review page
		Then Shopper clicks on Place Order Button
		Then Shopper clicks on Challenge OK Button and navigates to order confirmation page
		And log the order and payment details
		|Reg._MyAccount_WebSDK_Discover_3ds1-challenge-identified_Auth.|
		Then Go to MyAccount Page
		And Click on Payment View
		And Remove the Saved Payment 

@Reg._MyAccount_WebSDK_JCB_3ds2-challenge-identified_Auth.
    Scenario: Reg._MyAccount_WebSDK_JCB_3ds2-challenge-identified_Auth. | 3DS Challenge Flow
    	Then Go to MyAccount Page
		Then Shopper adds payment details on account payment form
		|Name on Card |Card Number|ExpiryMonth|ExpryYear|
		|3ds2-challenge-identified|3528000700000000|02|2024|
		Then Shopper does a checkout with saved card  
		Then Shopper enters "UnitedStates" shipping address
		And clicks on NextPayment button to navigate to payment section 
		Then Shopper enters "UnitedStates" billing address 
		And Shopper fills email and phone number on payment section
		|email|phoneno|
		|autoawp@yopmail.com|(33) 1 43 12 48 65|
		Then verify that no Disclaimer is present
		Then Shopper clicks on Next Review Order Button to navigate to order review page
		Then Shopper clicks on Place Order Button
		Then Shopper clicks on Challenge OK Button and navigates to order confirmation page
		And log the order and payment details
		|Reg._MyAccount_WebSDK_JCB_3ds2-challenge-identified_Auth.|
		Then Go to MyAccount Page
		And Click on Payment View
		And Remove the Saved Payment 

@Reg._MyAccount_WebSDK_Maestro_3ds2-frictionless-identified_Auth.
    Scenario: Reg._MyAccount_WebSDK_Maestro_3ds2-frictionless-identified_Auth. | 3DS Challenge Flow
    	Then Go to MyAccount Page
		Then Shopper adds payment details on account payment form
		|Name on Card |Card Number|ExpiryMonth|ExpryYear|
		|3ds2-frictionless-identified|6759649826438453|02|2024|
		Then Shopper does a checkout with saved card  
		Then Shopper enters "UnitedStates" shipping address
		And clicks on NextPayment button to navigate to payment section 
		Then Shopper enters "UnitedStates" billing address 
		And Shopper fills email and phone number on payment section
		|email|phoneno|
		|autoawp@yopmail.com|(33) 1 43 12 48 65|
		Then verify that no Disclaimer is present
		Then Shopper clicks on Next Review Order Button to navigate to order review page
		Then Shopper clicks on Place Order Button
		And log the order and payment details
		|Reg._MyAccount_WebSDK_Maestro_3ds2-frictionless-identified_Auth.|
		Then Go to MyAccount Page
		And Click on Payment View
		And Remove the Saved Payment 

@Reg._MyAccount_WebSDK_Master_3ds1-challenge-unknown-identity_Error.
    Scenario: Reg._MyAccount_WebSDK_Master_3ds1-challenge-unknown-identity_Error. | 3DS Challenge Flow
    	Then Go to MyAccount Page
		Then Shopper adds payment details on account payment form
		|Name on Card |Card Number|ExpiryMonth|ExpryYear|
		|3ds1-challenge-unknown-identity|5555555555554444|02|2024|
		Then Shopper does a checkout with saved card  
		Then Shopper enters "UnitedStates" shipping address
		And clicks on NextPayment button to navigate to payment section 
		Then Shopper enters "UnitedStates" billing address 
		And Shopper fills email and phone number on payment section
		|email|phoneno|
		|autoawp@yopmail.com|(33) 1 43 12 48 65|
		Then verify that no Disclaimer is present
		Then Shopper clicks on Next Review Order Button to navigate to order review page
		Then Shopper clicks on Place Order Button
		Then Shopper clicks on Challenge OK Button and views the error message
		Then Go to MyAccount Page
		And Click on Payment View
		And Remove the Saved Payment 

@Reg._MyAccount_WebSDK_VisaPurchasing_3ds2-frictionless-failed_Error.
    Scenario: Reg._MyAccount_WebSDK_VisaPurchasing_3ds2-frictionless-failed_Error. | 3DS Challenge Flow
    	Then Go to MyAccount Page
		Then Shopper adds payment details on account payment form
		|Name on Card |Card Number|ExpiryMonth|ExpryYear|
		|3ds2-frictionless-failed|4484070000000000|02|2024|
		Then Shopper does a checkout with saved card  
		Then Shopper enters "UnitedStates" shipping address
		And clicks on NextPayment button to navigate to payment section 
		Then Shopper enters "UnitedStates" billing address 
		And Shopper fills email and phone number on payment section
		|email|phoneno|
		|autoawp@yopmail.com|(33) 1 43 12 48 65|
		Then verify that no Disclaimer is present
		Then Shopper clicks on Next Review Order Button to navigate to order review page
		Then Shopper clicks on Place Order Button and views the error message
		Then Go to MyAccount Page
		And Click on Payment View
		And Remove the Saved Payment 


