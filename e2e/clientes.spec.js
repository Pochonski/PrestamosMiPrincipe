import { test, expect } from '@playwright/test';
import { seedOrgUser } from './helpers/supabase.js';

async function loginAndGoClientes(page, email, password, orgSlug) {
  await page.goto('/login');
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole('button', { name: /iniciar sesión/i }).click();

  // Esperar a que el login persista la sesión y redirija al dashboard (slug).
  await page.waitForURL(`**/${orgSlug}`, { timeout: 15000 });

  // Navegar a clientes (reload, la sesión ya está en localStorage).
  await page.goto(`/${orgSlug}/clientes`);
  await expect(page.getByRole('button', { name: /nuevo cliente/i })).toBeVisible({ timeout: 15000 });
}

test.describe('clientes', () => {
  test('crear cliente con validation y aparece en directorio', async ({ page }) => {
    const { email, password, orgSlug } = await seedOrgUser('clientes');
    await loginAndGoClientes(page, email, password, orgSlug);

    await page.getByRole('button', { name: /nuevo cliente/i }).click();

    await page.locator('input[name="nombre"]').fill('Maria Solis');
    await page.locator('textarea[name="direccion"]').fill('San Jose, Costa Rica');
    await page.getByRole('button', { name: /siguiente/i }).click();

    await page.locator('input[name="telefono"]').fill('88887777');
    await page.locator('input[name="cedula"]').fill('108230445');
    await page.getByRole('button', { name: /siguiente/i }).click();

    await page.getByRole('button', { name: /guardar cliente/i }).click();

    await expect(page.getByText('Maria Solis')).toBeVisible({ timeout: 10000 });
  });

  test('nombre corto muestra error y no avanza', async ({ page }) => {
    const { email, password, orgSlug } = await seedOrgUser('valida');
    await loginAndGoClientes(page, email, password, orgSlug);

    await page.getByRole('button', { name: /nuevo cliente/i }).click();

    await page.locator('input[name="nombre"]').fill('Ma');
    await page.locator('input[name="nombre"]').blur();

    await expect(page.getByText(/al menos 3 caracteres/i)).toBeVisible();
  });
});