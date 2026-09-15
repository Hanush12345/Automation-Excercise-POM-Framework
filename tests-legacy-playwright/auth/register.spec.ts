import { test, expect } from '../../src/fixtures/pages.fixture';
import { buildUser } from '../../src/utils/dataGenerator';

test.describe('Authentication - Registration', () => {
  test('TC01 @smoke @regression - Register a new user end to end', async ({
    homePage,
    loginPage,
    signupPage,
    accountStatusPage,
  }) => {
    const user = buildUser();

    await test.step('Open home page', async () => {
      await homePage.open();
      await homePage.assertHomePageVisible();
    });

    await test.step('Navigate to Signup / Login', async () => {
      await homePage.header.goToSignupLogin();
      await loginPage.assertSignupFormVisible();
    });

    await test.step('Start signup with name and email', async () => {
      await loginPage.startSignup(user.name, user.email);
      await signupPage.assertEnterAccountInformationVisible();
      await signupPage.assertPrefilled(user.name, user.email);
    });

    await test.step('Complete account and address information', async () => {
      await signupPage.completeRegistration(user);
    });

    await test.step('Verify account created and user logged in', async () => {
      await accountStatusPage.assertAccountCreated();
      await accountStatusPage.clickContinue();
      await homePage.header.assertLoggedInAs(user.name);
    });

    await test.step('Delete account (cleanup) and verify confirmation', async () => {
      await homePage.header.deleteAccount();
      await accountStatusPage.assertAccountDeleted();
      await accountStatusPage.clickContinue();
    });
  });

  test('TC05 @regression - Registering with an existing email is rejected', async ({
    homePage,
    loginPage,
    registrationFlow,
  }) => {
    const user = await test.step('Pre-condition: register a user', async () =>
      registrationFlow.registerNewUser());

    await test.step('Log out to reach a clean signup form', async () => {
      await homePage.header.logout();
      await loginPage.assertSignupFormVisible();
    });

    await test.step('Attempt signup with the same email', async () => {
      await loginPage.startSignup(user.name, user.email);
      await loginPage.assertEmailAlreadyExistsError();
    });

    await test.step('Cleanup: log back in and delete the account', async () => {
      await loginPage.login({ email: user.email, password: user.password });
      await homePage.header.assertLoggedInAs(user.name);
      await registrationFlow.deleteCurrentAccount();
    });
  });

  test('TC01a @regression - Newly registered user name is reflected in the header', async ({
    homePage,
    registrationFlow,
  }) => {
    const user = await registrationFlow.registerNewUser();
    expect(await homePage.header.loggedInUserName()).toBe(user.name);
    await registrationFlow.deleteCurrentAccount();
  });
});
