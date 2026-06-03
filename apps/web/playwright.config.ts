import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  workers: process.env['CI'] ? 1 : undefined,
  reporter: process.env['CI'] ? 'github' : 'list',

  use: {
    baseURL: process.env['E2E_BASE_URL'] ?? 'http://localhost:4200',
    trace:   'on-first-retry',
    // No depende de la API real — tests contra build prerenderizado
    // o dev server con mock de la API cuando se necesita
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Levanta el servidor de preview antes de los tests en CI
  webServer: process.env['CI']
    ? {
        command:   'npx serve dist/web/browser -p 4200 --no-clipboard',
        url:       'http://localhost:4200',
        reuseExistingServer: false,
        timeout:   30_000,
      }
    : undefined,
});
