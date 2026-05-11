import { test, expect } from '@playwright/test';

test('login → toggle habit → reload → persisted', async ({ page }) => {
  await page.goto('/login');

  // Enter PIN 1-2-3-4
  const inputs = page.locator('input[aria-label^="PIN digit"]');
  await expect(inputs).toHaveCount(4);
  await inputs.nth(0).fill('1');
  await inputs.nth(1).fill('2');
  await inputs.nth(2).fill('3');
  await inputs.nth(3).fill('4');

  // After last digit, the form auto-submits. Wait for Today view.
  await page.waitForURL((url) => url.pathname === '/', { timeout: 10_000 });

  // Find the first habit row and click its check button.
  const firstHabit = page.locator('button[aria-label^="Mark"]').first();
  await expect(firstHabit).toBeVisible();
  const isPressedBefore = await firstHabit.getAttribute('aria-pressed');
  await firstHabit.click();
  // Allow the server action to settle.
  await page.waitForTimeout(700);

  // Reload — the state should persist.
  await page.reload();
  const reloadedFirst = page.locator('button[aria-label^="Mark"]').first();
  await expect(reloadedFirst).toBeVisible();
  const isPressedAfter = await reloadedFirst.getAttribute('aria-pressed');
  expect(isPressedAfter).not.toBe(isPressedBefore);
});
