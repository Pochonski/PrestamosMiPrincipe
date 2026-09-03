import { test, expect } from '@playwright/test';

// Tests E2E de flujos puros (sin Supabase real)
// Estos tests verifican que la UI no crashee y que los wizards validen

test.describe('crear cliente wizard validations', () => {
  test.skip('requiere auth real - placeholder para CI con seed', async ({ page }) => {
    // Cuando haya seed de Supabase, descomentar:
    // 1. login
    // 2. click registrar cliente
    // 3. validar nombre corto muestra error
    // 4. validar teléfono 7 dígitos muestra error
    await page.goto('/login');
  });
});

test.describe('prestamo helpers via UI', () => {
  test('login page no crashea con mount', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('#root')).toBeVisible();
    // No debe haber error boundary
    await expect(page.getByText('Algo salió mal')).not.toBeVisible();
  });
});
