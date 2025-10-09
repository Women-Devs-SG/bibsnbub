import type { Page } from '@playwright/test';

export async function clickLocale(page: Page, code: 'EN' | 'ZH') {
  const trigger = page.getByRole('button', { name: 'Language Switcher' }).first();
  await trigger.click();

  const re = new RegExp(`^${code}$`);
  const candidate = page
    .getByRole('link', { name: re })
    .first()
    .or(page.getByRole('option', { name: re }).first())
    .or(page.getByRole('button', { name: re }).first())
    .or(page.getByText(re).first());

  await candidate.waitFor({ state: 'visible', timeout: 5000 });
  await candidate.click();
};
