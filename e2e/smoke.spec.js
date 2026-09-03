import { test, expect } from '@playwright/test';

test.describe('smoke', () => {
  test('login page loads', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('body')).toBeVisible();
    // Debería mostrar branding o form de login
    await expect(page.getByText(/Préstamos/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('navigate to login shows inputs', async ({ page }) => {
    await page.goto('/login');
    // Espera inputs de email/password o botón iniciar sesión
    const loginBtn = page.getByRole('button', { name: /iniciar/i });
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    // Al menos uno debe existir
    await expect(loginBtn.or(emailInput).first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('flujo crítico (sin auth real)', () => {
  test('ruta protegida redirige a login si no hay sesión', async ({ page }) => {
    await page.goto('/');
    // AuthGuard debería redirigir a /login
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });

  test('ruta /clientes protegida', async ({ page }) => {
    await page.goto('/clientes');
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });
});
