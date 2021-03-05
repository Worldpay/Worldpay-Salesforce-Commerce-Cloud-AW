var RELATIVE_PATH = './test/acceptance';
var OUTPUT_PATH = RELATIVE_PATH + '/report';
var HOST = '<host url>';
// e.g: https://dev01.sandbox.us01.dx.commercecloud.salesforce.com

var webDriver = {
    url: HOST,
    browser: 'chrome',
	/* desiredCapabilities: {
        chromeOptions: {
          args: [ "--headless", "--disable-gpu", "--no-sandbox", "--window-size=1920,1080" ]
        }
    },*/
    smartWait: 5000,
    waitForTimeout: 5000,
    windowSize: 'maximize',
    timeouts: {
        script: 60000,
        'page load': 10000

    }
};

exports.config = {
    output: OUTPUT_PATH,
    helpers: {
        WebDriver: webDriver,
        FileSystem: {}
		/* customHelper: {}
		customHelper: {
      		require: './helpers/customHelper.js',
    }*/
    },
    plugins: {
        wdio: {
            enabled: true,
            services: ['selenium-standalone']
        },
        allure: {
            enabled: true
        },
        tryTo: {
            enabled: true
        },
        retryFailedStep: {
            enabled: true,
            retries: 1
        }
    },
    include: {
        awpCardCheckout: RELATIVE_PATH + '/pages/awpCardCheckout.js',
        uriUtils: RELATIVE_PATH + '/utils/uriUtils.js',
        testData: RELATIVE_PATH + '/data/testData.js'
    },
    gherkin: {
        features: RELATIVE_PATH + '/features/PaymentMethods/**/*.feature',
        steps: [
            RELATIVE_PATH + '/features/steps/awpAll.steps.js'
        ]
    },
    tests: RELATIVE_PATH + '/tests/**/*.test.js',
    name: 'link_worldpay'
};
