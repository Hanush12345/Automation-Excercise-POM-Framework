import { test, expect } from '../../src/fixtures/pages.fixture';
import { uniqueEmail } from '../../src/utils/dataGenerator';

test.describe('Static content', () => {
  test('TC07 @smoke - Test Cases page loads with the expected content', async ({ homePage, testCasesPage }) => {
    await homePage.open();
    await homePage.header.goToTestCases();
    await testCasesPage.assertTestCasesPageVisible();
    expect(await testCasesPage.testCaseCount(), 'Test Cases page should list test cases').toBeGreaterThan(0);
  });
});

test.describe('Newsletter subscription', () => {
  test('TC10 @regression - Subscribe from the home page footer', async ({ homePage }) => {
    await homePage.open();
    await homePage.scrollToBottom();
    await homePage.footer.assertSubscriptionVisible();

    await homePage.footer.subscribe(uniqueEmail('qa.subscribe'));
    await homePage.footer.assertSubscribedSuccessfully();
  });

  test('TC11 @regression - Subscribe from the cart page footer', async ({ homePage, cartPage }) => {
    await homePage.open();
    await homePage.header.goToCart();
    await cartPage.assertCartPageVisible();

    await cartPage.scrollToBottom();
    await cartPage.footer.assertSubscriptionVisible();
    await cartPage.footer.subscribe(uniqueEmail('qa.cartsub'));
    await cartPage.footer.assertSubscribedSuccessfully();
  });
});

test.describe('Scroll behaviour', () => {
  test('TC25 @regression - Scroll up using the arrow button', async ({ homePage }) => {
    await homePage.open();
    await homePage.assertHomePageVisible();

    await test.step('Scroll to the bottom of the page', async () => {
      await homePage.scrollToBottom();
      await homePage.assertFooterSubscriptionInView();
      expect(await homePage.verticalScrollPosition()).toBeGreaterThan(0);
    });

    await test.step('Click the arrow and verify the hero section is back in view', async () => {
      await homePage.assertScrollUpArrowVisible();
      await homePage.clickScrollUpArrow();
      expect(await homePage.verticalScrollPosition()).toBe(0);
      await homePage.assertHeroHeadingInView();
    });
  });

  test('TC26 @regression - Scroll up without the arrow button', async ({ homePage }) => {
    await homePage.open();
    await homePage.assertHomePageVisible();

    await homePage.scrollToBottom();
    await homePage.assertFooterSubscriptionInView();

    await homePage.scrollToTop();
    expect(await homePage.verticalScrollPosition()).toBe(0);
    await homePage.assertHeroHeadingInView();
  });
});
