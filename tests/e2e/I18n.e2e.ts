import { expect, test } from '@playwright/test';
import { clickLocale } from './utils';

test.describe('I18n', () => {
  test.describe('Language Switching', () => {
    test('should switch language from English to Mandarin using dropdown and verify text on the homepage', async ({ page }) => {
      await page.goto('/');

      await expect(
        page.getByRole('heading', { name: 'Bibs & Bub' }),
      ).toBeVisible();

      clickLocale(page, 'ZH');

      await expect(
        page.getByRole('heading', { name: '点点BB' }),
      ).toBeVisible();
    });
  });
});
