const {I, awpCardCheckout, uriUtils} = inject();
let product;
let orderReviewPaymentDetails;
let orderConfirmationPaymentDetails;

When('Shopper is on home page and selects yes for tracking consent', () => 
{
  I.amOnPage(uriUtils.uri.homePage);
  awpCardCheckout.accept();
});

When('Shopper is on home page 13 and selects yes for tracking consent', () => 
{
  I.amOnPage('https://zzkv-013.sandbox.us01.dx.commercecloud.salesforce.com/on/demandware.store/Sites-MobileFirst-Site/en_US/Home-Show');
  awpCardCheckout.accept();
});

When ('Shopper searches for {string} and naviagtes to PDP', (inputProduct) => 
{
  product = inputProduct;
  awpCardCheckout.Search(product);
 
});

When('Shopper add the product to cart and click to Checkout', async () => 
{
  awpCardCheckout.addToCart();
  awpCardCheckout.viewCart();
  awpCardCheckout.clickCheckout();
});

When('Shopper clicks on checkout as guest and navigates to shipping page', async () => 
{
  awpCardCheckout.clickCheckoutAsGuest();
});

When('Shopper enters {string} shipping address', (country) => 
{
  awpCardCheckout.fillShippingAddress(country);
});	

When('clicks on NextPayment button to navigate to payment section', () => 
{
  awpCardCheckout.clickNextPaymentButton();
});

When('Shopper enters {string} billing address', (country) => 
{
	awpCardCheckout.fillBillingAddress(country);
});	

When('Shopper fills email and phone number on payment section', (table) => 
{
    for (const id in table.rows) {
      console.log(table.rows);
      if (id < 1) {
        continue; // skip a header of a table
      }
  
      // go by row cells
      const cells = table.rows[id].cells;
  
      // take values
      const emailID  = cells[0].value;
      const PhoneNo = cells[1].value;

      awpCardCheckout.fillEmailIDandPhoneNumber(emailID,PhoneNo);
    }});

When ('Shopper adds payment details on websdk payment form', (table) => 
{
    for (const id in table.rows) {
      console.log(table.rows);
      if (id < 1) {
        continue; // skip a header of a table
      }
  
      // go by row cells
      const cells = table.rows[id].cells;
  
      // take values
      //const email  = cells[0].value;
      //const PhonenNo = cells[1].value;
      const cardHolderName = cells[0].value;
      const cardNumber =cells[1].value;
      const expiry = cells[2].value;
      const cvv =cells[3].value;
      awpCardCheckout.fillWebsdkPaymentDetails(cardHolderName,cardNumber,expiry,cvv);
      //I.wait(5);
    }});

When ('Shopper adds payment details on direct card payment form', (table) =>
    {
    for (const id in table.rows) {
      console.log(table.rows);
      if (id < 1) {
        continue; // skip a header of a table
      }
  
      // go by row cells
      const cells = table.rows[id].cells;
  
      // take values
      //const email  = cells[0].value;
      //const PhonenNo = cells[1].value;
      const cardHolderName = cells[0].value;
      const cardNumber =cells[1].value;
      const expMonth = cells[2].value;
      const expYear=cells[3].value;
      const securityCode =cells[4].value;
      awpCardCheckout.fillDirectCardPaymentDetails(cardHolderName,cardNumber,expMonth,expYear,securityCode);
      //I.wait(5);
    }});

When ('Shopper clicks on Next Review Order Button to navigate to order review page', () => 
{
    awpCardCheckout.ClickOnNextReviewOrderButton();
	
  });

/*When('Shopper review payment details on order review page', async () => 
{
  I.waitForElement({css: "div[class='payment-details']"}, 10);
  orderReviewPaymentDetails = await I.grabTextFrom({css: "div[class='payment-details']"});
  
});*/

When('Shopper clicks on Place Order Button' , async () => 
{
      awpCardCheckout.PlaceOrderButton();
    });

When('Shopper clicks on Place Order Button and views the error message' , async () => 
{
      awpCardCheckout.PlaceOrderButtonError();
    });

When ('Shopper clicks on Challenge OK Button and navigates to order confirmation page' , async () => 
{
    awpCardCheckout.clickOnChallengeOkButton();
  });

When ('Shopper clicks on Challenge OK Button and views the error message' , async () => 
{
    awpCardCheckout.clickOnChallengeOkButtonError();
  });

/*When('Shopper review payment details on order confirmation page', async () => 
{
  I.waitForElement({css: "div[class='payment-details']"}, 15);
  orderConfirmationPaymentDetails = await I.grabTextFrom({css: "div[class='payment-details']"});
});*/

When('log the order and payment details', async (table) => 
{
  const scenario = table.rows[0].cells[0].value;
  I.waitForElement('.summary-details.order-number', 20);
  I.waitForElement({xpath: "//span[@class='grand-total-sum']"}, 15);
  let orderNumber = await I.grabTextFrom('.summary-details.order-number');
  let orderTotal = await I.grabTextFrom({xpath: "//span[@class='grand-total-sum']"});
  console.log(orderNumber, orderTotal );
  I.waitForElement({css: "div[class='payment-details']"}, 15);
  orderConfirmationPaymentDetails = await I.grabTextFrom({css: "div[class='payment-details']"});
  orderConfirmationPaymentDetails = orderConfirmationPaymentDetails.replace(/\n/g, ' ');

  //let paymentConfirm = (orderConfirmationPaymentDetails == orderReviewPaymentDetails) ? "PaymentDetailsMatch":"PaymentDetailsMis-Match";
   //let pd = await I.grabTextFrom('.payment-details');
  //console.log(pd);
  I.writeToFile('result.log', '\n' + scenario + ': ' + orderNumber + ': ' + orderTotal + ' - ' + orderConfirmationPaymentDetails + '\n' );
  //I.writeToFile('result.log', '\n' + pd + ': ' + pin);
});

When('Verify saved card details', async (table) => 
{
 for (const id in table.rows) {
      console.log(table.rows);
      if (id < 1) {
        continue; // skip a header of a table
      }
  
      // go by row cells
      const cells = table.rows[id].cells;
  
      // take values
      const name  = cells[0].value;
      const cardExpiry = cells[1].value;
  I.waitForElement({xpath :"//button[@aria-label='Delete Payment']"}, 8); 
  I.waitForEnabled({xpath :"//button[@aria-label='Delete Payment']"}, 8);
  I.waitForElement({css :"div[class='card-header']"}, 10);
  I.see(name, {css :"div[class='card-header']"});
  I.waitForElement({xpath :"//div[@class='card-body card-body-positioning']"}, 8);
  I.see(cardExpiry, {xpath :"//div[@class='card-body card-body-positioning']"});
  /*I.wait(5);
  let ccName = await I.grabTextFrom({css :"h2[class='pull-left']"});
  let ccExpiry = await I.grabTextFrom({xpath :"//div[@class='card-body card-body-positioning']"});
  I.wait(5);
  console.log(ccName);
  console.log(ccExpiry);
  I.wait(5);
 awpCardCheckout.verifySavedCard(name, cardExpiry);*/
}});



////////////////////////////////////////////////////////////////////////////////////////////////////////

When('Shopper clicks on login button and navigates to login page', async () => 
{
  awpCardCheckout.clickonLoginButton();
});

When('Shopper enters the login credentials and clicks on Login Button', (table) => 
{
	for (const id in table.rows) {
        console.log(table.rows);
        if (id < 1) {
          continue; // skip a header of a table
        }
    
        // go by row cells
        const cells = table.rows[id].cells;
    
        // take values
        const email = cells[0].value;
        const password = cells[1].value;
        awpCardCheckout.loginByLoginButtonHomePage(email, password);  
      }});

	When('Go to MyAccount Page', () => 
	{
	I.amOnPage(uriUtils.uri.accountPage);
	I.wait(2);
	I.waitForElement({css: "a[aria-label='Add New Payment']"}, 5)
	});

	When('Go to MyAccount13 Page', () => 
	{
	I.amOnPage('https://zzkv-013.sandbox.us01.dx.commercecloud.salesforce.com/on/demandware.store/Sites-MobileFirst-Site/en_US/Account-Show');
	});

	When('selects Disclaimer No Option web', () =>
    {
      awpCardCheckout.disclaimerNoWeb();
    });

    When('selects Disclaimer Yes Option web', () =>
    {
      awpCardCheckout.disclaimerYesWeb();
    });

	

	When('unchecks save card option', () =>
    {
      awpCardCheckout.disclaimerUnCheckWeb();
    });

	

	When('Click on Payment View', () => 
	{
    awpCardCheckout.clickOnPaymentView();
	});

	When('Remove the Saved Payment' ,() =>
    {
      awpCardCheckout.removeSavedPayment();
    });

	When('Shopper does a checkout with saved card' ,() =>
	{
	I.amOnPage(uriUtils.uri.pdpPage);
	awpCardCheckout.addToCart();
	awpCardCheckout.viewCart();
	awpCardCheckout.clickCheckout();
	});

	When('Shopper does a checkout 13 with saved card' ,() =>
	{
	I.amOnPage('https://zzkv-013.sandbox.us01.dx.commercecloud.salesforce.com/on/demandware.store/Sites-MobileFirst-Site/en_US/Product-Show?pid=25490259');
	awpCardCheckout.addToCart();
	awpCardCheckout.viewCart();
	awpCardCheckout.clickCheckout();
	});

	Then('Shopper enters cvv for the Saved card', table =>
  {
  for (const id in table.rows) {
    console.log(table.rows);
    if (id < 1) {
      continue; // skip a header of a table
    }

    // go by row cells
    const cells = table.rows[id].cells;
   
    // take values
    const cvv = cells[0].value;
  
    awpCardCheckout.enterCvv(cvv);
    }});

	Then('verify that no Disclaimer is present', () =>
	{
	 awpCardCheckout.NoDisclaimerPresent();
	});

	
	When ('Shopper adds new card details on websdk with -ve magic value', (table) => 
	{
    for (const id in table.rows) {
      console.log(table.rows);
      if (id < 1) {
        continue; // skip a header of a table
      }
  
      // go by row cells
      const cells = table.rows[id].cells;
  
      // take values
      const email  = cells[0].value;
      const PhonenNo = cells[1].value;
      const cardHolderName = cells[2].value;
      const cardNumber =cells[3].value;
      const expiry = cells[4].value;
      const cvv =cells[5].value;
      awpCardCheckout.fillNegativeCardDetailswebsdk(email,PhonenNo,cardHolderName,cardNumber,expiry,cvv);
      I.wait(5);
    }});

When ('Refused error message is displayed' , async () => 
{
    I.see('Error while verifying your card with the bank. Please fill in correct details.', '#novtokenerror');
    let pin = await I.grabTextFrom('#novtokenerror');
		console.log(pin);
    });

When ('Error message is displayed' , async () => 
{
    I.see('Server is Unavailable', '#wpservererror');
    let pin = await I.grabTextFrom('#wpservererror');
		console.log(pin);
    });

Then ('Verify no Payment Saved' ,() =>
    {
	  I.waitForElement({css: "a[aria-label='Add New Payment']"});
      I.dontSeeElement({xpath :"//button[@aria-label='Delete Payment']"});
    });

Then ('make sure no payment is saved' ,() =>
    {
	   I.wait(1);
	   tryTo(() => I.click({xpath :"//a[@aria-label='View saved payment methods']"}));
	   I.wait(1);
	   tryTo(() => I.click({xpath :"//button[@aria-label='Delete Payment']"}));
	   I.wait(1);
	   tryTo(() => I.click({xpath :"//button[normalize-space()='Yes']"}));
	   I.wait(1);
	});

When ('Shopper adds payment details on account payment form', (table) =>
    {
    for (const id in table.rows) {
      console.log(table.rows);
      if (id < 1) {
        continue; // skip a header of a table
      }
  
      // go by row cells
      const cells = table.rows[id].cells;
  
      // take values
      //const email  = cells[0].value;
      //const PhonenNo = cells[1].value;
      const cardHolderName = cells[0].value;
      const cardNumber =cells[1].value;
      const expMonth = cells[2].value;
      const expYear=cells[3].value;
      awpCardCheckout.fillAccountCardPaymentDetails(cardHolderName,cardNumber,expMonth,expYear);
      //I.wait(5);
    }});



















