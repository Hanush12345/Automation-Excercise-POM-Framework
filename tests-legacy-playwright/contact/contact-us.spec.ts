import * as path from 'path';
import { test } from '../../src/fixtures/pages.fixture';
import { buildContactMessage } from '../../src/utils/dataGenerator';

const ATTACHMENT = path.resolve(process.cwd(), 'resources/upload-sample.txt');

test.describe('Contact Us', () => {
  test('TC06 @smoke @regression - Submit the Contact Us form with an attachment', async ({
    homePage,
    contactUsPage,
  }) => {
    const message = buildContactMessage({ attachmentPath: ATTACHMENT });

    await test.step('Navigate to Contact Us', async () => {
      await homePage.open();
      await homePage.header.goToContactUs();
      await contactUsPage.assertGetInTouchVisible();
    });

    await test.step('Fill the form and upload a file', async () => {
      await contactUsPage.fillForm(message);
    });

    await test.step('Submit and accept the browser confirm dialog', async () => {
      await contactUsPage.submitAndAcceptDialog();
      await contactUsPage.assertSubmittedSuccessfully();
    });

    await test.step('Return home', async () => {
      await contactUsPage.clickHome();
      await homePage.assertHomePageVisible();
    });
  });
});
