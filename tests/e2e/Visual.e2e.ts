import percySnapshot from '@percy/playwright';
import { expect, test } from '@playwright/test';

test.describe('Visual testing', () => {
  test.describe('Static pages', () => {
    test('should take screenshot of the homepage', async ({ page }) => {
      await page.goto('/');

      await expect(
        page.getByRole('heading', { name: 'Bibs & Bub' }),
      ).toBeVisible();

      await percySnapshot(page, 'Homepage');
    });

    test('should take screenshot of the Mandarin homepage', async ({ page }) => {
      await page.goto('/zh');

      await expect(
        page.getByRole('heading', { name: '点点BB' }),
      ).toBeVisible();

      await percySnapshot(page, 'Homepage - Mandarin');
    });
  });
});
