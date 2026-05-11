import { test, expect } from '@playwright/test';

test('login → toggle habit → reload → persisted', async ({ page }) => {
  await page.goto('/login');

  const inputs = page.locator('input[aria-label^="PIN digit"]');
  await expect(inputs).toHaveCount(4);
  await inputs.nth(0).fill('1');
  await inputs.nth(1).fill('2');
  await inputs.nth(2).fill('3');
  await inputs.nth(3).fill('4');

  await page.waitForURL((url) => url.pathname === '/', { timeout: 10_000 });

  const firstHabit = page.locator('button[aria-label^="Mark"]').first();
  await expect(firstHabit).toBeVisible();
  const before = await firstHabit.getAttribute('aria-pressed');
  await firstHabit.click();

  // Wait for the optimistic UI to flip
  await expect.poll(async () => firstHabit.getAttribute('aria-pressed'), { timeout: 5000 }).not.toBe(before);

  // Give the server action time to settle before reload
  await page.waitForTimeout(800);
  await page.reload();

  const reloadedFirst = page.locator('button[aria-label^="Mark"]').first();
  await expect(reloadedFirst).toBeVisible();
  const after = await reloadedFirst.getAttribute('aria-pressed');
  expect(after).not.toBe(before);
});
