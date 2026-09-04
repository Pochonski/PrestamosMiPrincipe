import { test, expect } from '@playwright/test';

test.describe('auth', () => {
  test('signup, login y onboarding crean organización', async ({ page }) => {
    const email = `e2e-auth-${Date.now()}@test.local`;
    const password = 'password123';

    // Signup
    await page.goto('/signup');
    await page.locator('input[name="full_name"]').fill('Test E2E');
    await page.locator('input[name="email"]').fill(email);
    await page.locator('input[name="password"]').fill(password);
    await page.getByRole('button', { name: /crear cuenta/i }).click();

    // Sin organización → onboarding (redirect automático tras signup)
    await expect(page.getByText(/creá tu organización/i)).toBeVisible({ timeout: 10000 });

    // Crear organización
    await page.locator('input[name="org_name"]').fill(`Préstamos ${Date.now()}`);
    await page.getByRole('button', { name: /crear organización/i }).click();

    // Redirige al dashboard (slug)
    await expect(page).toHaveURL(/\/prestamos-\d+/, { timeout: 15000 });
  });

  test('ruta protegida redirige a login sin sesión', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });
});