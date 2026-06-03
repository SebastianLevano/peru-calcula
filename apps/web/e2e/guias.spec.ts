import { test, expect } from '@playwright/test';

test.describe('Guías', () => {
  test('muestra la lista de guías con campo de búsqueda', async ({ page }) => {
    await page.goto('/guias');

    await expect(page.locator('h1')).toContainText(/Guías/i);
    // El campo de búsqueda debe estar presente
    await expect(page.locator('input[type="search"], input[placeholder*="Buscar"], input[placeholder*="buscar"]')).toBeVisible();
  });

  test('tiene metadatos SEO correctos', async ({ page }) => {
    await page.goto('/guias');

    const metaDescription = page.locator('meta[name="description"]');
    await expect(metaDescription).toHaveAttribute('content', /.+/);
  });
});

test.describe('SEO y accesibilidad', () => {
  test('la página principal tiene título y meta description', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(/.+/);
    const metaDescription = page.locator('meta[name="description"]');
    await expect(metaDescription).toHaveAttribute('content', /.+/);
  });

  test('calculadora CTS tiene lang y title SEO', async ({ page }) => {
    await page.goto('/calculadora-cts');

    const html = page.locator('html');
    await expect(html).toHaveAttribute('lang', 'es');
    await expect(page).toHaveTitle(/CTS/i);
  });
});
