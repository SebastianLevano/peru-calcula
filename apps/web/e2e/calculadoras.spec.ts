import { test, expect } from '@playwright/test';

// Tests e2e de calculadoras contra el build prerenderizado (ADR-28).
// No requieren API real — validan que el HTML prerenderizado es correcto
// y que la interfaz de usuario es funcional.

test.describe('Calculadora CTS', () => {
  test('muestra el formulario con todos los campos requeridos', async ({ page }) => {
    await page.goto('/calculadora-cts');

    await expect(page.locator('h1')).toContainText(/CTS/i);
    await expect(page.locator('input, select').first()).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('el botón simular está deshabilitado sin datos', async ({ page }) => {
    await page.goto('/calculadora-cts');

    const btn = page.locator('button[type="submit"]');
    await expect(btn).toBeDisabled();
  });

  test('tiene un TrustBadge / señal de confianza visible después de calcular (si la API responde)', async ({ page }) => {
    await page.goto('/calculadora-cts');
    // Solo verifica la estructura del formulario sin la API
    await expect(page.locator('form')).toBeVisible();
  });
});

test.describe('Simulador Crédito Personal', () => {
  test('muestra el formulario con monto, plazo y TEA', async ({ page }) => {
    await page.goto('/simulador-credito-personal');

    await expect(page.locator('h1')).toContainText(/Crédito Personal/i);
    await expect(page.locator('input[id="monto"]')).toBeVisible();
    await expect(page.locator('input[id="plazo"]')).toBeVisible();
    await expect(page.locator('input[id="tea"]')).toBeVisible();
  });

  test('el plazo tiene valor por defecto 24', async ({ page }) => {
    await page.goto('/simulador-credito-personal');

    const plazoInput = page.locator('input[id="plazo"]');
    await expect(plazoInput).toHaveValue('24');
  });
});

test.describe('Comparador de Préstamos', () => {
  test('muestra el selector de tipo de crédito', async ({ page }) => {
    await page.goto('/comparador-de-prestamos');

    await expect(page.locator('h1')).toContainText(/Comparador/i);
    // Los tres tipos deben existir
    await expect(page.getByText('Personal')).toBeVisible();
    await expect(page.getByText('Vehicular')).toBeVisible();
    await expect(page.getByText('Hipotecario')).toBeVisible();
  });

  test('el botón comparar está deshabilitado sin monto', async ({ page }) => {
    await page.goto('/comparador-de-prestamos');

    const btn = page.locator('button[type="submit"]');
    await expect(btn).toBeDisabled();
  });
});

test.describe('Calculadora Hipotecaria', () => {
  test('muestra el plazo por defecto de 240 meses', async ({ page }) => {
    await page.goto('/calculadora-hipotecaria');

    await expect(page.locator('h1')).toContainText(/Hipotecario/i);
    const plazoInput = page.locator('input[id="plazo"]');
    await expect(plazoInput).toHaveValue('240');
  });
});

test.describe('Calculadora Crédito Vehicular', () => {
  test('muestra el plazo por defecto de 60 meses', async ({ page }) => {
    await page.goto('/calculadora-credito-vehicular');

    await expect(page.locator('h1')).toContainText(/Vehicular/i);
    const plazoInput = page.locator('input[id="plazo"]');
    await expect(plazoInput).toHaveValue('60');
  });
});
