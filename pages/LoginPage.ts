import { Locator, Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { HeaderComponent } from './components';
import { ROUTES } from '../src/data/routes';
import { MESSAGES } from '../src/data/testData';
import { UserCredentials } from '../src/types';

/** /login hosts BOTH the "New User Signup!" and "Login to your account" forms. */
export class LoginPage extends BasePage {
  readonly path = ROUTES.login;
  readonly pageIdentifier: Locator;
  readonly header: HeaderComponent;

  // Signup half
  readonly signupHeading: Locator;
  readonly signupNameInput: Locator;
  readonly signupEmailInput: Locator;
  readonly signupButton: Locator;
  readonly emailExistsError: Locator;

  // Login half
  readonly loginHeading: Locator;
  readonly loginEmailInput: Locator;
  readonly loginPasswordInput: Locator;
  readonly loginButton: Locator;
  readonly invalidCredentialsError: Locator;

  constructor(page: Page) {
    super(page);
    this.header = new HeaderComponent(page);
    this.pageIdentifier = page.locator('.login-form');

    this.signupHeading = page.locator('.signup-form h2');
    this.signupNameInput = page.locator('input[data-qa="signup-name"]');
    this.signupEmailInput = page.locator('input[data-qa="signup-email"]');
    this.signupButton = page.locator('button[data-qa="signup-button"]');
    this.emailExistsError = page.locator('.signup-form p', { hasText: MESSAGES.emailAlreadyExists });

    this.loginHeading = page.locator('.login-form h2');
    this.loginEmailInput = page.locator('input[data-qa="login-email"]');
    this.loginPasswordInput = page.locator('input[data-qa="login-password"]');
    this.loginButton = page.locator('button[data-qa="login-button"]');
    this.invalidCredentialsError = page.locator('.login-form p', { hasText: MESSAGES.incorrectCredentials });
  }

  async assertLoginFormVisible(): Promise<void> {
    await expect(this.loginHeading).toHaveText(MESSAGES.loginToAccount);
  }

  async assertSignupFormVisible(): Promise<void> {
    await expect(this.signupHeading).toHaveText(MESSAGES.newUserSignup);
  }

  async startSignup(name: string, email: string): Promise<void> {
    await this.fill(this.signupNameInput, name);
    await this.fill(this.signupEmailInput, email);
    await this.safeClick(this.signupButton);
  }

  async login(credentials: UserCredentials): Promise<void> {
    await this.fill(this.loginEmailInput, credentials.email);
    await this.fill(this.loginPasswordInput, credentials.password);
    await this.safeClick(this.loginButton);
  }

  async assertInvalidCredentialsError(): Promise<void> {
    await expect(this.invalidCredentialsError).toBeVisible();
    await expect(this.invalidCredentialsError).toHaveText(MESSAGES.incorrectCredentials);
  }

  async assertEmailAlreadyExistsError(): Promise<void> {
    await expect(this.emailExistsError).toBeVisible();
    await expect(this.emailExistsError).toHaveText(MESSAGES.emailAlreadyExists);
  }
}
