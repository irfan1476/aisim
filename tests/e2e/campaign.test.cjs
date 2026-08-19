const { test, expect } = require("@playwright/test");

const profiles = {
  balanced: {
    baseline: [3, 3, 3, 4, 3],
    allocation: {
      infra: 25,
      data: 25,
      people: 18,
      mlops: 10,
      compliance: 12,
      innovation: 10,
    },
    selected: ["demand", "energy", "quality"],
    reveal: "Pragmatic Builder",
  },
  "data-driven": {
    baseline: [3, 3, 3, 5, 4],
    allocation: {
      infra: 18,
      data: 36,
      people: 15,
      mlops: 10,
      compliance: 12,
      innovation: 9,
    },
    selected: ["demand", "supply", "quality"],
    reveal: "Evidence-Led Operator",
  },
  "people-first": {
    baseline: [5, 3, 3, 4, 3],
    allocation: {
      infra: 20,
      data: 20,
      people: 25,
      mlops: 10,
      compliance: 10,
      innovation: 15,
    },
    selected: ["knowledge", "demand", "maintenance"],
    reveal: "Capability Builder",
  },
  "tech-first": {
    baseline: [2, 4, 2, 2, 5],
    allocation: {
      infra: 30,
      data: 30,
      people: 12,
      mlops: 15,
      compliance: 8,
      innovation: 5,
    },
    selected: ["maintenance", "quality", "energy"],
    reveal: "Scale Accelerator",
  },
  "risk-tolerant": {
    baseline: [2, 5, 2, 2, 5],
    allocation: {
      infra: 25,
      data: 25,
      people: 12,
      mlops: 10,
      compliance: 8,
      innovation: 20,
    },
    selected: ["knowledge", "maintenance", "supply"],
    reveal: "Bold Experimenter",
  },
  "risk-averse": {
    baseline: [3, 1, 5, 3, 2],
    allocation: {
      infra: 18,
      data: 25,
      people: 20,
      mlops: 10,
      compliance: 20,
      innovation: 7,
    },
    selected: ["quality", "energy", "demand"],
    reveal: "Trust Steward",
  },
};

async function startCampaign(page, profile) {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page
    .getByRole("button", { name: "Start your transformation" })
    .first()
    .click();
  await page
    .getByRole("button", { name: "Take the baseline assessment" })
    .click();
  for (let index = 0; index < profile.baseline.length; index += 1) {
    await page
      .getByTestId(`baseline-${index}-${profile.baseline[index]}`)
      .click();
  }
  await page.getByRole("button", { name: "Enter the boardroom" }).click();
  await expect(page.getByTestId("campaign-quarter")).toContainText("Quarter 1");
}

async function setAllocation(page, allocation) {
  for (const [key, value] of Object.entries(allocation)) {
    await page
      .getByTestId(`allocation-${key}`)
      .evaluate((element, nextValue) => {
        const valueSetter = Object.getOwnPropertyDescriptor(
          HTMLInputElement.prototype,
          "value",
        ).set;
        valueSetter.call(element, String(nextValue));
        element.dispatchEvent(new Event("input", { bubbles: true }));
        element.dispatchEvent(new Event("change", { bubbles: true }));
      }, value);
  }
  await expect(page.getByText("100% allocated")).toBeVisible();
}

async function chooseInitiatives(page, ids) {
  for (const id of [
    "maintenance",
    "quality",
    "demand",
    "energy",
    "knowledge",
    "supply",
  ]) {
    const card = page.getByTestId(`initiative-${id}`);
    if (
      (await card.getAttribute("data-selected")) === "true" &&
      !ids.includes(id)
    )
      await card.click();
  }
  for (const id of [
    "maintenance",
    "quality",
    "demand",
    "energy",
    "knowledge",
    "supply",
  ]) {
    const card = page.getByTestId(`initiative-${id}`);
    const selected = (await card.getAttribute("data-selected")) === "true";
    if (!selected && ids.includes(id)) await card.click();
  }
  await expect(page.getByText("3 / 3 selected")).toBeVisible();
}

async function resolveQuarter(page, profile) {
  await chooseInitiatives(page, profile.selected);
  await setAllocation(page, profile.allocation);
  await page.getByRole("button", { name: "Confirm decisions" }).click();
  await expect(page.getByTestId("quarter-results")).toBeVisible();

  let advance = page.getByRole("button", {
    name: /Continue to next quarter|View final verdict/,
  });
  if (!(await advance.isVisible().catch(() => false))) {
    const crisisOption = page
      .getByTestId("quarter-results")
      .locator("button")
      .first();
    await crisisOption.click();
    advance = page.getByRole("button", {
      name: /Continue to next quarter|View final verdict/,
    });
  }
  await advance.click();
}

async function completeCampaign(page, profile, startQuarter = 1) {
  for (let quarter = startQuarter; quarter <= 12; quarter += 1) {
    await expect(page.getByTestId("campaign-quarter")).toContainText(
      `Quarter ${quarter}`,
    );
    await resolveQuarter(page, profile);
  }
  await expect(
    page.getByRole("heading", { name: "Your strategy has a story." }),
  ).toBeVisible();
}

async function persistedState(page) {
  return page.evaluate(() => {
    const raw = localStorage.getItem("ai-investment-game");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed.state || parsed;
  });
}

test("full campaign preserves Q1 values, survives reloads, and ends with evidence", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  const profile = profiles.balanced;
  await startCampaign(page, profile);
  await expect(page.getByText(/Strategic pattern:/)).toHaveCount(0);

  const visibleQ1 = {};
  for (const id of [
    "maintenance",
    "quality",
    "demand",
    "energy",
    "knowledge",
    "supply",
  ]) {
    const card = page.getByTestId(`initiative-${id}`);
    visibleQ1[id] = {
      roi: Number(await card.getAttribute("data-base-roi")),
      cost: Number(await card.getAttribute("data-base-cost")),
    };
  }

  await resolveQuarter(page, profile);
  const afterQ1 = await persistedState(page);
  for (const [id, values] of Object.entries(visibleQ1)) {
    expect(afterQ1.initiativeStates[id].roi).toBe(values.roi);
    expect(afterQ1.initiativeStates[id].cost).toBe(values.cost);
  }

  await resolveQuarter(page, profile);
  await resolveQuarter(page, profile);
  const beforeFirstReload = await persistedState(page);
  expect(beforeFirstReload.q).toBe(4);
  await page.reload();
  await expect(page.getByTestId("campaign-quarter")).toContainText("Quarter 4");
  expect((await persistedState(page)).history).toHaveLength(3);

  await resolveQuarter(page, profile);
  await resolveQuarter(page, profile);
  const beforeSecondReload = await persistedState(page);
  expect(beforeSecondReload.q).toBe(6);
  await page.reload();
  await expect(page.getByTestId("campaign-quarter")).toContainText("Quarter 6");
  expect((await persistedState(page)).roi).toBeCloseTo(
    beforeSecondReload.roi,
    6,
  );

  await completeCampaign(page, profile, 6);
  await expect(page.getByText(/Across 12 quarters/)).toBeVisible();
  await expect(page.getByText(/Pattern confidence/)).toBeVisible();
  await expect(page.getByText(profile.reveal, { exact: false })).toBeVisible();
  expect(errors).toEqual([]);
});

for (const [name, profile] of Object.entries(profiles).filter(
  ([name]) => name !== "balanced",
)) {
  test(`${name} strategy is discovered only after the campaign`, async ({
    page,
  }) => {
    await startCampaign(page, profile);
    await expect(page.getByText(profile.reveal, { exact: false })).toHaveCount(
      0,
    );
    await completeCampaign(page, profile);
    await expect(
      page.getByText(profile.reveal, { exact: false }),
    ).toBeVisible();
  });
}
