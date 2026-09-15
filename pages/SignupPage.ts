import { Locator, Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { ROUTES } from '../src/data/routes';
import { MESSAGES } from '../src/data/testData';
import { UserAccount } from '../src/types';

/** /signup — the full "Enter Account Information" form. */
export class SignupPage extends BasePage {
  readonly path = ROUTES.signup;
  readonly pageIdentifier: Locator;

  readonly enterAccountInfoHeading: Locator;
  readonly genderMrRadio: Locator;
  readonly genderMrsRadio: Locator;
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly daysSelect: Locator;
  readonly monthsSelect: Locator;
  readonly yearsSelect: Locator;
  readonly newsletterCheckbox: Locator;
  readonly offersCheckbox: Locator;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly companyInput: Locator;
  readonly address1Input: Locator;
  readonly address2Input: Locator;
  readonly countrySelect: Locator;
  readonly stateInput: Locator;
  readonly cityInput: Locator;
  readonly zipcodeInput: Locator;
  readonly mobileNumberInput: Locator;
  readonly createAccountButton: Locator;

  constructor(page: Page) {
    super(page);
    this.pageIdentifier = page.locator('.login-form h2 b', { hasText: MESSAGES.enterAccountInformation });
    this.enterAccountInfoHeading = this.pageIdentifier;

    this.genderMrRadio = page.locator('#id_gender1');
    this.genderMrsRadio = page.locator('#id_gender2');
    this.nameInput = page.locator('input[data-qa="name"]');
    this.emailInput = page.locator('input[data-qa="email"]');
    this.passwordInput = page.locator('input[data-qa="password"]');
    this.daysSelect = page.locator('select[data-qa="days"]');
    this.monthsSelect = page.locator('select[data-qa="months"]');
    this.yearsSelect = page.locator('select[data-qa="years"]');
    this.newsletterCheckbox = page.locator('#newsletter');
    this.offersCheckbox = page.locator('#optin');
    this.firstNameInput = page.locator('input[data-qa="first_name"]');
    this.lastNameInput = page.locator('input[data-qa="last_name"]');
    this.companyInput = page.locator('input[data-qa="company"]');
    this.address1Input = page.locator('input[data-qa="address"]');
    this.address2Input = page.locator('input[data-qa="address2"]');
    this.countrySelect = page.locator('select[data-qa="country"]');
    this.stateInput = page.locator('input[data-qa="state"]');
    this.cityInput = page.locator('input[data-qa="city"]');
    this.zipcodeInput = page.locator('input[data-qa="zipcode"]');
    this.mobileNumberInput = page.locator('input[data-qa="mobile_number"]');
    this.createAccountButton = page.locator('button[data-qa="create-account"]');
  }

  async assertEnterAccountInformationVisible(): Promise<void> {
    await expect(this.enterAccountInfoHeading).toBeVisible();
  }

  /** Verifies the name/email carried over from the /login signup form are pre-filled. */
  async assertPrefilled(name: string, email: string): Promise<void> {
    await expect(this.nameInput).toHaveValue(name);
    await expect(this.emailInput).toHaveValue(email);
  }

  async fillAccountInformation(user: UserAccount): Promise<void> {
    await (user.gender === 'Mr' ? this.genderMrRadio : this.genderMrsRadio).check();
    await this.fill(this.passwordInput, user.password);
    await this.daysSelect.selectOption(user.dateOfBirth.day);
    await this.monthsSelect.selectOption(user.dateOfBirth.month);
    await this.yearsSelect.selectOption(user.dateOfBirth.year);
    if (user.newsletter) await this.newsletterCheckbox.check();
    if (user.offers) await this.offersCheckbox.check();
  }

  async fillAddressInformation(user: UserAccount): Promise<void> {
    await this.fill(this.firstNameInput, user.firstName);
    await this.fill(this.lastNameInput, user.lastName);
    await this.fill(this.companyInput, user.company);
    await this.fill(this.address1Input, user.address1);
    await this.fill(this.address2Input, user.address2);
    await this.countrySelect.selectOption(user.country);
    await this.fill(this.stateInput, user.state);
    await this.fill(this.cityInput, user.city);
    await this.fill(this.zipcodeInput, user.zipcode);
    await this.fill(this.mobileNumberInput, user.mobileNumber);
  }

  async submit(): Promise<void> {
    await this.safeClick(this.createAccountButton);
  }

  async completeRegistration(user: UserAccount): Promise<void> {
    await this.assertEnterAccountInformationVisible();
    await this.fillAccountInformation(user);
    await this.fillAddressInformation(user);
    await this.submit();
  }
}
