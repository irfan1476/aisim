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
  await page.getByRole('button', { name: 'Begin the V3 board window' }).click();
  await expect(page.getByTestId('v3-window-shell')).toBeVisible();
  await expect(page.getByTestId('campaign-quarter')).toContainText('Window 1');
}

test('V3 opens with a focused Window 1 Orient state', async ({ page }) => {
  await startProjectFactoryV3(page);

  await expect(page.getByRole('heading', { name: 'Which evidence-building priority should receive capacity in Q1–Q3?' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Review three priorities' })).toBeVisible();
  await expect(page.getByRole('complementary', { name: 'V3 analytics' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Inspect before you commit' })).toHaveCount(0);
  await expect(page.getByText('Capacity legend:')).toBeVisible();
});

test('V3 Compare presents exactly three bounded research priorities', async ({ page }) => {
  await startProjectFactoryV3(page);
  await page.getByRole('button', { name: 'Review three priorities' }).click();

  const group = page.getByRole('radiogroup', { name: 'Window 1 Research priorities' });
  await expect(group.getByRole('radio')).toHaveCount(3);
  await expect(group.getByText('Predictive Maintenance')).toBeVisible();
  await expect(group.getByText('Visual Quality Inspection')).toBeVisible();
  await expect(group.getByText('Technician Knowledge Assistant')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Continue with Predictive Maintenance' })).toBeVisible();
  await expect(page.getByText(/Only Research is available in Window 1/)).toBeVisible();
});

test('V3 Commit records research and shows a no-operating-benefit outcome', async ({ page }) => {
  await startProjectFactoryV3(page);
  await page.getByRole('button', { name: 'Review three priorities' }).click();
  await page.getByRole('button', { name: 'Continue with Predictive Maintenance' }).click();
  await expect(page.getByRole('heading', { name: 'Predictive Maintenance' })).toBeVisible();
  await page.getByRole('button', { name: 'Confirm research' }).click();

  await expect(page.getByText('Window 1 research review')).toBeVisible();
  await expect(page.getByText(/Operating metrics did not improve/)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Pilot-ready with conditions' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Reflect on outcome' })).toBeVisible();

  const persisted = await page.evaluate(() => JSON.parse(localStorage.getItem('ai-investment-game')).state);
  expect(persisted.v3State.initiatives.maintenance.lifecycle).toBe('research');
  expect(persisted.v3State.ledger).toHaveLength(1);
  expect(persisted.v3State.budget.spent).toBeCloseTo(0.25);
});

test('V3 completes the reflection handoff without exposing the active-play sidecar', async ({ page }) => {
  await startProjectFactoryV3(page);
  await page.getByRole('button', { name: 'Review three priorities' }).click();
  await page.getByRole('button', { name: 'Continue with Predictive Maintenance' }).click();
  await page.getByRole('button', { name: 'Confirm research' }).click();
  await page.getByRole('button', { name: 'Reflect on outcome' }).click();
  await page.getByLabel('Window 1 reflection').fill('Require usable history and a named technician disposition owner.');
  await page.getByRole('button', { name: 'Save and continue' }).click();
  const persisted = await page.evaluate(() => JSON.parse(localStorage.getItem('ai-investment-game')).state);
  expect(persisted.v3State.baseline.responses).toHaveLength(5);
  expect(persisted.v3State.ledger[0].outcome.status).toBe('pilot-ready-with-conditions');
  expect(persisted.v3State.ledger[0].reflection).toContain('usable history');
  expect(persisted.v3State.windowHistory[0].quarterSnapshots).toHaveLength(3);
  await expect(page.getByRole('heading', { name: 'Your Research decision is carried forward.' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Enter Window 2' })).toBeVisible();
  await expect(page.getByRole('complementary', { name: 'V3 analytics' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Enter Window 2' }).click();
  await expect(page.getByTestId('v3-window-preview-boundary')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'The next board window is not authored yet.' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Review three priorities' })).toHaveCount(0);
});

test('Standard mode remains on the legacy path without the V3 shell', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole('button', { name: 'Start your transformation' }).first().click();
  await page.getByRole('button', { name: 'Take the baseline assessment' }).click();
  for (let index = 0; index < 5; index += 1) await page.getByTestId(`baseline-${index}-3`).click();
  await page.getByRole('button', { name: 'Enter the boardroom' }).click();
  await page.getByRole('button', { name: 'Begin campaign' }).click();
  await expect(page.getByTestId('v3-window-shell')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Choose initiatives' })).toBeVisible();
});
