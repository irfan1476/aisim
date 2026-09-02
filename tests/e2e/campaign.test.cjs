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
  const operatingMode = page.getByRole("group", { name: "Operating mode" });
  const standardMode = operatingMode.getByRole("button", { name: /Standard mode/ });
  if ((await standardMode.getAttribute("aria-pressed")) !== "true") {
    await standardMode.click();
  }
  await page
    .getByRole("button", { name: "Start baseline assessment" })
    .click();
  for (let index = 0; index < profile.baseline.length; index += 1) {
    await page
      .getByTestId(`baseline-${index}-${profile.baseline[index]}`)
      .click();
  }
  await page.getByRole("button", { name: "Enter the boardroom" }).click();
  await page.getByRole("button", { name: "Begin campaign" }).click();
  await expect(page.getByTestId("campaign-quarter")).toContainText("Quarter 1");
  await dismissQuickStart(page);
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
  const availableIds = await page
    .locator('[data-testid^="initiative-"]')
    .evaluateAll((cards) =>
      cards.map((card) => card.getAttribute("data-testid").replace("initiative-", "")),
    );
  for (const id of availableIds) {
    const card = page.getByTestId(`initiative-${id}`);
    if (
      (await card.getAttribute("data-selected")) === "true" &&
      !ids.includes(id)
    )
      await card.click();
  }
  for (const id of availableIds) {
    const card = page.getByTestId(`initiative-${id}`);
    const selected = (await card.getAttribute("data-selected")) === "true";
    if (!selected && ids.includes(id)) await card.click();
  }
  await expect(page.getByText("3 / 3 selected")).toBeVisible();
}

async function startScenarioCampaign(page, scenarioId) {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page
    .getByRole("button", { name: "Start your transformation" })
    .first()
    .click();

  const operatingMode = page.getByRole("group", { name: "Operating mode" });
  const scenarioToggle = operatingMode.getByRole("button", { name: /Scenario mode/ });
  if ((await scenarioToggle.getAttribute("aria-pressed")) !== "true") {
    await scenarioToggle.click();
  }
  await expect(scenarioToggle).toHaveAttribute("aria-pressed", "true");
  await page.locator("#scenario-select").selectOption(scenarioId);
  await page.getByRole("button", { name: "Start baseline assessment" }).click();

  for (let index = 0; index < 5; index += 1) {
    await page.getByTestId(`baseline-${index}-3`).click();
  }
  await page.getByRole("button", { name: "Enter the boardroom" }).click();
  await page.getByRole("button", { name: "Begin campaign" }).click();
  await expect(page.getByTestId("campaign-quarter")).toContainText("Quarter 1");
  await dismissQuickStart(page);
}

async function dismissQuickStart(page) {
  const dismiss = page.getByRole("button", { name: "Dismiss Quarter 1 guidance" });
  if (await dismiss.isVisible().catch(() => false)) await dismiss.click();
}

async function resolveQuarter(page, profile) {
  await chooseInitiatives(page, profile.selected);
  await setAllocation(page, profile.allocation);
  await page.waitForTimeout(150);
  const quickFix = page.getByRole("button", {
    name: /Apply quick fix and recalculate|Make plan executable/,
  });
  // The first match is the operating-system funding control, which carries
  // the exact required amount. The later warning button rounds to one decimal
  // and can remain fractionally below the actual minimum.
  const fundPlan = page.getByRole("button", { name: /^Fund this plan/ }).first();
  // Funding can reveal an oversight/capacity constraint, while the quick fix
  // can surface an underfunded plan. Re-check both once rather than assuming
  // a single fixed order in the evolving decision UI.
  for (let attempt = 0; attempt < 4; attempt += 1) {
    if (await quickFix.first().isVisible().catch(() => false)) {
      await quickFix.first().click();
      await page.waitForTimeout(150);
    }
    if (await fundPlan.isVisible().catch(() => false)) {
      await fundPlan.click();
      await page.waitForTimeout(150);
    }
    if (await page.getByRole("button", { name: "Confirm decisions" }).isEnabled()) {
      break;
    }
  }
  await expect(page.getByRole("button", { name: "Confirm decisions" })).toBeEnabled();
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

async function resumeCampaign(page) {
  const resume = page.getByRole("button", { name: "Resume saved campaign" });
  if (await resume.isVisible().catch(() => false)) await resume.click();
}

test("board advisor answers distinct suggested questions without an LLM", async ({ page }) => {
  await page.route("**/api/llm/chat", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ error: "No provider configured" }),
    }),
  );
  await startCampaign(page, profiles.balanced);

  await page.getByRole("button", { name: "Open board advisor" }).click();
  const advisor = page.getByTestId("board-advisor");
  const questions = advisor.locator("button").filter({ hasText: /\?/ });
  await expect(questions).toHaveCount(3);

  await questions.nth(0).click();
  const first = await advisor.getByTestId("board-advisor-answer").textContent();
  await expect(advisor.getByTestId("board-advisor-answer")).toContainText("Evidence");
  await expect(advisor.getByTestId("board-advisor-answer")).not.toContainText("Checking whether");

  await questions.nth(1).click();
  const second = await advisor.getByTestId("board-advisor-answer").textContent();
  expect(second).not.toEqual(first);
  await expect(advisor.getByTestId("board-advisor-answer")).toContainText("Next check");
});

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
  await resumeCampaign(page);
  await expect(page.getByTestId("campaign-quarter")).toContainText("Quarter 4");
  expect((await persistedState(page)).history).toHaveLength(3);

  await resolveQuarter(page, profile);
  await resolveQuarter(page, profile);
  const beforeSecondReload = await persistedState(page);
  expect(beforeSecondReload.q).toBe(6);
  await page.reload();
  await resumeCampaign(page);
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

test("scenario mode shows domain challenges, scenario initiatives, and a three-bet limit", async ({
  page,
}) => {
  await startScenarioCampaign(page, "bankNext");

  await expect(page.getByText("Operating signal focus").first()).toBeVisible();
  await expect(page.getByText("Digital fraud incidents")).toBeVisible();
  await expect(page.getByText("Credit approval speed")).toBeVisible();
  await expect(page.getByText("Compliance readiness").first()).toBeVisible();

  const scenarioIds = [
    "fraudDetection",
    "creditRiskAssessment",
    "customerCopilot",
    "complianceMonitoring",
    "rmSalesAssistant",
    "personalizedEngine",
  ];
  for (const id of scenarioIds) {
    await expect(page.getByTestId(`initiative-${id}`)).toBeVisible();
  }

  await chooseInitiatives(page, scenarioIds.slice(0, 3));
  await page.getByTestId("initiative-complianceMonitoring").click();
  await expect(page.getByText("3 / 3 selected")).toBeVisible();
  await expect(
    page.getByTestId("initiative-complianceMonitoring"),
  ).toHaveAttribute("data-selected", "false");
});

test("decision tools open the current coach and strategy simulator", async ({
  page,
}) => {
  await startCampaign(page, profiles.balanced);
  await page.getByRole("button", { name: "Quarter coach" }).click();
  const coach = page.getByRole("dialog", { name: "Quarter coach" });
  await expect(coach).toBeVisible();
  await expect(coach).toContainText("Live decision impact");
  await coach.getByRole("button", { name: "Close quarter coach" }).click();
  await page.getByRole("button", { name: "Strategy simulator" }).click();
  await expect(page.getByRole("heading", { name: "Explore before you commit" })).toBeVisible();
  await expect(page.getByText("Predicted operating outcome")).toBeVisible();
  await page.getByRole("button", { name: "Close strategy simulator" }).click();
});

test("scenario challenges remain visible while a discovery quarter records evidence", async ({
  page,
}) => {
  await startScenarioCampaign(page, "bankNext");
  const initial = await persistedState(page);
  const challengePanel = page.locator("section").filter({ hasText: "Operating signal focus" }).first();
  await expect(challengePanel).toContainText(/Critical|Watch|Recovering|Controlled/);
  await expect(challengePanel).toContainText("Current");

  await resolveQuarter(page, {
    ...profiles.balanced,
    selected: ["fraudDetection", "creditRiskAssessment", "complianceMonitoring"],
  });
  const after = await persistedState(page);
  expect(after.q).toBe(initial.q + 1);
  expect(after.history).toHaveLength(1);
  expect(after.history[0].initiativeActions).toBeTruthy();
  await expect(page.locator("section").filter({ hasText: "Operating signal focus" }).first())
    .toContainText(/Critical|Watch|Recovering|Controlled/);
});

test("V2 analytics uses latest completed-quarter spend and separates DNA from evolution", async ({
  page,
}) => {
  await startScenarioCampaign(page, "bankNext");
  await resolveQuarter(page, {
    ...profiles.balanced,
    selected: ["fraudDetection", "creditRiskAssessment", "complianceMonitoring"],
  });
  const completed = await persistedState(page);
  const q1Spend = Number(completed.history[0].metrics.spent || 0);
  expect(completed.q).toBe(2);
  expect(q1Spend).toBeGreaterThan(0);

  await page.getByRole("button", { name: "Open analytics" }).click();
  const analytics = page.getByRole("dialog", { name: "Insights and analytics" });
  await expect(analytics).toContainText("Q1 outcome recorded");
  await expect(analytics).toContainText("last completed quarter");
  await expect(analytics).not.toContainText("$0.00M last completed quarter");
  await expect(analytics).toContainText(`$${q1Spend.toFixed(2)}M`);

  await analytics.getByRole("button", { name: "Diagnostics" }).click();
  await expect(analytics).toContainText("Decision → consequence");
  await expect(analytics).toContainText("Latest completed quarter · Q1");
  await expect(analytics).toContainText("Next actions");
  await expect(analytics).not.toContainText("No recommendation has been generated for the current state.");

  await analytics.getByRole("button", { name: "DNA" }).click();
  await expect(analytics).toContainText("Strategy DNA");
  await expect(analytics).not.toContainText("Initiative evolution & spend");
  await analytics.getByRole("button", { name: "Evolution" }).click();
  await expect(analytics).toContainText("Initiative evolution & spend");
  await expect(analytics).toContainText("Strategy DNA is the separate interpretation");
});

test("V2 approved recommendation becomes actionable next-quarter guidance", async ({
  page,
}) => {
  await startCampaign(page, profiles.balanced);
  await chooseInitiatives(page, ["maintenance", "quality", "energy"]);
  await setAllocation(page, {
    infra: 30,
    data: 25,
    people: 10,
    mlops: 15,
    compliance: 10,
    innovation: 10,
  });
  const capacityFix = page.getByRole("button", { name: "Apply quick fix and recalculate" });
  if (await capacityFix.isVisible().catch(() => false)) await capacityFix.click();
  await page.getByRole("button", { name: /^Fund this plan/ }).first().click();
  await expect(page.getByRole("button", { name: "Confirm decisions" })).toBeEnabled();
  await page.getByRole("button", { name: "Confirm decisions" }).click();
  const results = page.getByTestId("quarter-results");
  const approve = results.getByRole("button", { name: "Approve recommendation" }).first();
  await expect(approve).toBeVisible();
  await approve.click();
  await expect(results.getByRole("button", { name: /Approved for next decision/ })).toBeVisible();
  await results.getByRole("button", { name: /Continue to next quarter/ }).click();

  const guidance = page.getByText("Next-quarter guidance").first();
  await expect(guidance).toBeVisible();
  const before = await persistedState(page);
  await page.getByRole("button", { name: /Apply suggestion/ }).last().click();
  const after = await persistedState(page);
  expect(after.q).toBe(2);
  expect(after.nextQuarterGuidance).toBeNull();
  expect(after.selected.length).toBeGreaterThanOrEqual(1);
  expect(after.selected.length).toBeLessThanOrEqual(3);
  expect(after.selected).not.toEqual(before.selected);
});

test("strategy simulator previews the active scenario without advancing the campaign", async ({ page }) => {
  await startCampaign(page, profiles.balanced);
  await page.getByRole("button", { name: "Strategy simulator" }).click();
  await expect(page.getByRole("heading", { name: "Explore before you commit" })).toBeVisible();
  await expect(page.getByText("Decision comparison")).toBeVisible();
  await expect(page.getByText("Predicted operating outcome")).toBeVisible();
  await expect(page.getByRole("button", { name: "Apply as next-quarter draft" })).toBeVisible();
  await expect(page.getByTestId("campaign-quarter")).toContainText("Quarter 1");
});

test("Standard mode keeps scenario-only UI and initiative IDs absent", async ({
  page,
}) => {
  await startCampaign(page, profiles.balanced);

  await expect(page.getByText("Digital fraud incidents")).toHaveCount(0);
  await expect(page.getByTestId("initiative-demand")).toBeVisible();
  await expect(page.getByTestId("initiative-fraudDetection")).toHaveCount(0);
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
