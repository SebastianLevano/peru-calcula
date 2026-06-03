import { test, expect } from '@playwright/test';

test.describe('Home', () => {
  test('carga la página principal con lista de calculadoras', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(/Perú Calcula/i);

    // Debe haber al menos un enlace a una calculadora
    const calcLinks = page.locator('a[href*="calculadora"], a[href*="simulador"], a[href*="comparador"]');
    await expect(calcLinks.first()).toBeVisible();
  });

  test('la navegación a CTS funciona desde el home', async ({ page }) => {
    await page.goto('/');

    const ctsLink = page.locator('a[href*="calculadora-cts"]').first();
    await expect(ctsLink).toBeVisible();
    await ctsLink.click();

    await expect(page).toHaveURL(/calculadora-cts/);
    await expect(page.locator('h1')).toContainText(/CTS/i);
  });
});
