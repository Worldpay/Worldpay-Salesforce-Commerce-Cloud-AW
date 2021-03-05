Following are the pre-reqisites to run the codeceptjs automation suite for sfcc-awp:
====================================================================================

Storefront:
===========
1. Make sure there exists user with username|password - |code1auto1@yopmail.com|Test@123|. If doesn't exists create an user with username|password - |code1auto1@yopmail.com|Test@123|.
2. Login with the above user and make sure there are no saved payments under my account.

SFCC BM:
========
1. Custom Preferences: Make sure that the Credit Card Mode Direct is enabled when DirectCheckout scripts needs to be run and Web is enabled while running WebCheckout scripts are running 
2. Inventory: Make sure that the inventory is set to perpetual for the product 013742333299.

codecept.conf:
==============
1. Make sure proper url is configured for the HOST. 

Automation Suites:
1. Automation scripts are present under test\acceptance\AutomationSuites folder. Copy the required scripts, place them under test\acceptance\features\PaymentMethods folder and run. 
