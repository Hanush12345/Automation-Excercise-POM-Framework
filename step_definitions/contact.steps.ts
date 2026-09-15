import * as path from 'path';
import { When, Then } from '@cucumber/cucumber';
import { buildContactMessage } from '../src/utils/dataGenerator';
import { CustomWorld } from '../support/world';

const ATTACHMENT = path.resolve(process.cwd(), 'resources/upload-sample.txt');

When('I navigate to Contact Us via the header', async function (this: CustomWorld) {
  await this.homePage.header.goToContactUs();
});

Then('the {string} section should be visible', async function (this: CustomWorld, section: string) {
  if (section !== 'Get In Touch') throw new Error(`Unknown section: "${section}"`);
  await this.contactUsPage.assertGetInTouchVisible();
});

When('I fill in the contact form with a random message and an attachment', async function (this: CustomWorld) {
  const message = buildContactMessage({ attachmentPath: ATTACHMENT });
  this.scenarioState.message = message;
  await this.contactUsPage.fillForm(message);
});

When('I submit the form and accept the confirmation dialog', async function (this: CustomWorld) {
  await this.contactUsPage.submitAndAcceptDialog();
});

Then('the submission should be confirmed', async function (this: CustomWorld) {
  await this.contactUsPage.assertSubmittedSuccessfully();
});

When('I click the Home button', async function (this: CustomWorld) {
  await this.contactUsPage.clickHome();
});
