import { expect, test } from '@playwright/test';

test('boots the game shell, changes settings, and accepts an action', async ({ page }) => {
  await page.route('**/*generativelanguage.googleapis.com/**', (route) => route.abort());
  await page.route('**/*aiplatform.googleapis.com/**', (route) => route.abort());

  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'ISEKAI ENGINE' })).toBeVisible();
  await expect(page.getByText('System Online v3.1')).toBeVisible();
  await expect(page.getByText('No Visual Data')).toBeVisible();
  await expect(page.getByText('The void awaits your presence...')).toBeVisible();

  await page.getByTitle('System Settings').click();
  await expect(page.getByRole('heading', { name: 'System Configuration' })).toBeVisible();
  await page.getByText('Pro Quality').click();
  await page.getByRole('button', { name: 'Confirm' }).click();
  await expect(page.getByRole('heading', { name: 'System Configuration' })).toBeHidden();

  const actionInput = page.getByPlaceholder('Declare your action...');
  await expect(actionInput).toBeEnabled();
  await actionInput.fill('Look around the Divine Realm');
  await actionInput.press('Enter');

  await expect(page.getByText('Summoning world data...')).toBeVisible();
  await expect(page.getByText('The void awaits your presence...')).toBeVisible();
  await expect(page.getByPlaceholder('Declare your action...')).toBeEnabled();
});
