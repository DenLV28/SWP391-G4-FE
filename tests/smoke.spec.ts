import { test, expect } from '@playwright/test';

test('homepage smoke test', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/ParkFlow|Parking|React/i);
  await expect(page.locator('h1', { hasText: /Tìm và thuê chỗ đỗ xe an toàn, tiện lợi/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Tìm chỗ ngay/i })).toBeVisible();
});
