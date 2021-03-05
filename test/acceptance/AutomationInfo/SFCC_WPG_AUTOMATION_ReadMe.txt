Following are the pre-reqisites to run the codeceptjs automation suite for sfcc-awp:
====================================================================================
CodeceptJS:
===========
1. Replace the "FileSystem.js" file present in the InstalledDir\node_modules\codeceptjs\lib\helper with the one present in the test/acceptance/AutomationInfo/Helper folder.
2. Place the "tryTo.js" file in the InstalledDir\node_modules\codeceptjs\lib\plugin which is present in the test/acceptance/AutomationInfo/Plugin folder.
3. Make sure the chrome driver version is properly set in the default-config file which is located in the InstalledDir\node_modules\selenium-standalone\lib

Storefront:
===========
1. Make sure there exists user with username/password|autoawp@yopmail.com@yopmail.com/Test@123|. If doesn't exists create an user with username/password|autoawp@yopmail.com@yopmail.com/Test@123|.
2. Login with the above user and make sure there are no saved addresses & payments under my account.

Automation Suites/Feature files:
=================================
1. In the feature files, for navigation to PDP page, search string "Hammered Gold Earrings" is used in scripts. Make necessary changes as appropriate to your catalogue.

codecept.conf (Path where "test" directory is present) & uriUrils (Path: test\acceptance\utils):
===============================================================================================
1. Make sure proper domain url is configured in codecept.conf.js and path urls in uriUtils.js. 


Automation_Scenarios:
=====================
1. The automation scenarios are drafted in BDD format and present under test/acceptance/AutomationInfo/AutomationSuites.


How to run Automation:
=====================
1. Create a folder named PaymentMethods under test/acceptance/features and place the desired test suite folder from test/acceptance/AutomationInfo/AutomationSuites under PaymentMethods folder.
2. Run cmd/bash from root location where test folder resides with 'npm run test:acceptance' command.
3. Once Automation is complete result.log file is generated on the path where "test" directory is present. This result.log file contains list of Order Numbers of the passed scenarios.

To run WebSDK Test suite, the below custom preferences need to be set in SFCC Business manager:
====================================================================================================
1. Merchant Tools > Custom Preferences > AccessWorldpay-General > Credit Card Security Model is set to "WEB_SDK"
2. Merchant Tools > Custom Preferences > AccessWorldpay-SecureTransaction > Enable Magic Values is set to "Yes"
3. Merchant Tools > Custom Preferences > AccessWorldpay-SecureTransaction > 3ds Type is set to "two3d"

To run DisableCVVDirect	 Test suite, the below custom preferences need to be set in SFCC Business manager:
===============================================================================================================
1. Merchant Tools > Custom Preferences > AccessWorldpay-General > Credit Card Security Model is set to "DIRECT"
2. Merchant Tools > Custom Preferences > AccessWorldpay-General > Worldpay Disable CVV is set to "Yes"
3. Merchant Tools > Custom Preferences > AccessWorldpay-SecureTransaction > Enable Magic Values is set to "Yes"
4. Merchant Tools > Custom Preferences > AccessWorldpay-SecureTransaction > 3ds Type is set to "two3d"

To run EnableCVVDirect Test suite, the below custom preferences need to be set in SFCC Business manager:
===============================================================================================================
1. Merchant Tools > Custom Preferences > AccessWorldpay-General > Credit Card Security Model is set to "DIRECT"
2. Merchant Tools > Custom Preferences > AccessWorldpay-General > Worldpay Disable CVV is set to "No"
3. Merchant Tools > Custom Preferences > AccessWorldpay-SecureTransaction > Enable Magic Values is set to "Yes"
4. Merchant Tools > Custom Preferences > AccessWorldpay-SecureTransaction > 3ds Type is set to "two3d"
 

How to generate Allure report for Automation execution results:
===============================================================
1. Run cmd/bash from root location where test folder resides with 'npm run test:acceptance:launchReport' command.



