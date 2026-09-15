import { Page } from '@playwright/test';
import { HomePage } from '../../pages/HomePage';
import { LoginPage } from '../../pages/LoginPage';
import { SignupPage } from '../../pages/SignupPage';
import { AccountStatusPage } from '../../pages/MiscPages';
import { buildUser } from '../utils/dataGenerator';
import { UserAccount } from '../types';

/**
 * Task layer: multi-page business journeys.
 * Keeps specs readable and stops page objects from depending on each other.
 */
export class RegistrationFlow {
  private readonly home: HomePage;
  private readonly login: LoginPage;
  private readonly signup: SignupPage;
  private readonly accountStatus: AccountStatusPage;

  constructor(page: Page) {
    this.home = new HomePage(page);
    this.login = new LoginPage(page);
    this.signup = new SignupPage(page);
    this.accountStatus = new AccountStatusPage(page);
  }

  /** Registers a brand-new user end to end and leaves the session logged in. */
  async registerNewUser(overrides: Partial<UserAccount> = {}): Promise<UserAccount> {
    const user = buildUser(overrides);

    await this.home.open();
    await this.home.assertHomePageVisible();
    await this.home.header.goToSignupLogin();

    await this.login.assertSignupFormVisible();
    await this.login.startSignup(user.name, user.email);

    await this.signup.assertPrefilled(user.name, user.email);
    await this.signup.completeRegistration(user);

    await this.accountStatus.assertAccountCreated();
    await this.accountStatus.clickContinue();
    await this.home.header.assertLoggedInAs(user.name);

    return user;
  }

  /** Registers from inside the checkout funnel (TC14) — assumes /login is already open. */
  async registerFromCheckout(overrides: Partial<UserAccount> = {}): Promise<UserAccount> {
    const user = buildUser(overrides);
    await this.login.assertSignupFormVisible();
    await this.login.startSignup(user.name, user.email);
    await this.signup.completeRegistration(user);
    await this.accountStatus.assertAccountCreated();
    await this.accountStatus.clickContinue();
    await this.home.header.assertLoggedInAs(user.name);
    return user;
  }

  /** Teardown: deletes the account so reruns never hit "Email Address already exist!". */
  async deleteCurrentAccount(): Promise<void> {
    await this.home.header.deleteAccount();
    await this.accountStatus.assertAccountDeleted();
    await this.accountStatus.clickContinue();
  }
}
