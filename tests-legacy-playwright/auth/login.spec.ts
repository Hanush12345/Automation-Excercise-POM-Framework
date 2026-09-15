import { test } from '../../src/fixtures/pages.fixture';

test.describe('Authentication - Login and Logout', () => {
  test('TC02 @smoke @regression - Login with valid credentials', async ({
    homePage,
    loginPage,
    registrationFlow,
  }) => {
    const user = await test.step('Pre-condition: register and log out', async () => {
      const created = await registrationFlow.registerNewUser();
      await homePage.header.logout();
      return created;
    });

    await test.step('Log in with the registered credentials', async () => {
      await loginPage.assertLoginFormVisible();
      await loginPage.login({ email: user.email, password: user.password });
      await homePage.header.assertLoggedInAs(user.name);
    });

    await test.step('Cleanup', async () => registrationFlow.deleteCurrentAccount());
  });

  test('TC03 @regression - Login with invalid credentials shows an error', async ({ homePage, loginPage }) => {
    await homePage.open();
    await homePage.header.goToSignupLogin();
    await loginPage.assertLoginFormVisible();

    await loginPage.login({ email: 'not.a.real.user.9f2c@example.com', password: 'WrongPassw0rd!' });
    await loginPage.assertInvalidCredentialsError();
    await homePage.header.assertLoggedOut();
  });

  test('TC04 @regression - Logout returns the user to the login page', async ({
    homePage,
    loginPage,
    registrationFlow,
  }) => {
    const user = await registrationFlow.registerNewUser();

    await test.step('Log out and verify redirect to /login', async () => {
      await homePage.header.logout();
      await loginPage.assertLoginFormVisible();
      await loginPage.expectUrlToContain('/login');
      await homePage.header.assertLoggedOut();
    });

    await test.step('Cleanup: log back in and delete the account', async () => {
      await loginPage.login({ email: user.email, password: user.password });
      await registrationFlow.deleteCurrentAccount();
    });
  });
});
