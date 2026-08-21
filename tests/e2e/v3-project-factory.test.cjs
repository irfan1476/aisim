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

test('V3 decision loop records cited evidence and learner prediction in the ledger', async ({ page }) => {
  await startProjectFactoryV3(page);
  await page.locator('article').filter({ hasText: 'Asset-data readiness assessment' }).getByRole('button', { name: 'Cite in decision' }).click();
  await page.getByLabel('Decision rationale').fill('Start with a bounded research cycle to validate asset data before a pilot.');
  await page.getByLabel('Decision prediction').fill('Asset-data readiness should improve after the research cycle.');
  await page.getByLabel('Key assumption').fill('The maintenance team can provide protected review time.');
  await page.getByRole('button', { name: 'deferred to research' }).click();
  await expect(page.getByText('V3 decision recorded. Review the evidence and outcome before the next board window.').first()).toBeVisible();
  await page.getByRole('button', { name: 'Continue to next quarter' }).click();
  const sidecar = page.getByRole('complementary', { name: 'V3 analytics' });
  await sidecar.getByRole('tab', { name: 'Ledger' }).click();
  await expect(sidecar.getByText('Start with a bounded research cycle to validate asset data before a pilot.')).toBeVisible();
  await expect(sidecar.getByText('PF-E02')).toBeVisible();
});
