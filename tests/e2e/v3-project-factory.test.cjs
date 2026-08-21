const { test, expect } = require('@playwright/test');

async function startProjectFactoryV3(page) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole('button', { name: 'Start your transformation' }).first().click();
  const toggle = page.locator('button[aria-pressed]').first();
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await toggle.click();
  await page.locator('#scenario-select').selectOption('project-factory-2030');
  await page.getByRole('button', { name: 'Take the baseline assessment' }).click();
  for (let index = 0; index < 5; index += 1) await page.getByTestId(`baseline-${index}-3`).click();
  await page.getByRole('button', { name: 'Enter the boardroom' }).click();
  await page.getByRole('button', { name: 'Begin campaign' }).click();
  await expect(page.getByTestId('campaign-quarter')).toContainText('Quarter 1');
}

test('opt-in Project Factory V3 exposes evidence, plan, and sidecar tabs', async ({ page }) => {
  await startProjectFactoryV3(page);

  await expect(page.getByRole('heading', { name: 'Inspect before you commit' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'maintenance' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Decision sidecar' })).toBeVisible();

  const sidecar = page.getByRole('complementary', { name: 'V3 analytics' });
  await expect(sidecar).toBeVisible();
  for (const label of ['Dashboard', 'Ledger', 'Metrics', 'Evidence', 'Governance']) {
    await expect(sidecar.getByRole('tab', { name: label })).toBeVisible();
  }
  await sidecar.getByRole('tab', { name: 'Evidence' }).click();
  await expect(sidecar.getByText('Asset-data readiness assessment')).toBeVisible();
  await sidecar.getByRole('tab', { name: 'Metrics' }).click();
  await expect(sidecar.getByText(/Owner:/).first()).toBeVisible();
});

test('Standard mode does not mount the V3 sidecar or evidence room', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole('button', { name: 'Start your transformation' }).first().click();
  await page.getByRole('button', { name: 'Take the baseline assessment' }).click();
  for (let index = 0; index < 5; index += 1) await page.getByTestId(`baseline-${index}-3`).click();
  await page.getByRole('button', { name: 'Enter the boardroom' }).click();
  await page.getByRole('button', { name: 'Begin campaign' }).click();
  await expect(page.getByTestId('campaign-quarter')).toContainText('Quarter 1');
  await expect(page.getByRole('complementary', { name: 'V3 analytics' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Inspect before you commit' })).toHaveCount(0);
});
