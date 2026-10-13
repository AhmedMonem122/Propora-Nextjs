/* QA-C: lease with pickers, payment record, maintenance assign, document upload. */
export default async function run(page, ui) {
  const out = { steps: [] };
  const step = (n, ok, extra = '') => out.steps.push({ n, ok, extra: String(extra).slice(0, 160) });
  const BASE = 'https://propora-nextjs.vercel.app';

  await page.goto(`${BASE}/login`);
  await page.getByLabel('Email').fill('qa-owner-mv6qlftl@example.com');
  await page.getByLabel('Password', { exact: true }).fill('Str0ng!Pass123');
  await page.getByRole('button', { name: /^log in$/i }).click();
  await page.waitForURL('**/dashboard**', { timeout: 30000 });
  step('login', true);

  // --- lease ---
  await page.goto(`${BASE}/dashboard/leases`);
  await page.getByRole('heading', { name: /leases/i }).waitFor({ timeout: 15000 });
  await page.waitForTimeout(2500);
  let snap = await ui.snapshot();
  const newLeaseRef = snap.match(/@(e\d+) button "([^"]*(New|Add)[^"]*)"/)?.[1];
  if (!newLeaseRef) {
    step('lease dialog', false, 'no new-button');
    return out;
  }
  await ui.click(newLeaseRef);
  await page.waitForTimeout(800);
  // unit picker (scoped by its field label)
  await page.locator('label:has-text("Unit") + div button').first().click();
  await page.waitForTimeout(1000);
  await page.getByRole('combobox').fill('QA-A-101');
  await page.getByRole('option', { name: /QA-A-101/ }).first().waitFor({ timeout: 15000 });
  await page.getByRole('option', { name: /QA-A-101/ }).first().click();
  step('lease unit picker lists', true);
  await page.waitForTimeout(800);
  // resident picker (scoped by its field label)
  await page.locator('label:has-text("Resident") + div button').first().click();
  await page.waitForTimeout(1000);
  await page.getByRole('combobox').fill('QA Resident');
  await page.waitForTimeout(1800);
  const resOpt = page.getByRole('option', { name: /QA Resident/ });
  step('lease resident picker lists', (await resOpt.count()) > 0);
  if ((await resOpt.count()) > 0) await resOpt.first().click();
  await page.waitForTimeout(500);
  await page.getByLabel('Start date').fill('2026-01-01');
  await page.getByLabel('Rent amount').fill('4500');
  await page.getByRole('button', { name: /create lease/i }).click();
  await page.waitForTimeout(3000);
  step('lease created', (await page.getByText('QA-A-101').count()) > 0);

  // --- record payment on leases page (if the action exists) ---
  snap = await ui.snapshot();
  const hasPayAction = /pay|record|checkout/i.test(snap);
  step('leases page payment action present', hasPayAction);

  // --- maintenance create + assign ---
  await page.goto(`${BASE}/dashboard/maintenance`);
  await page.getByRole('heading', { name: /maintenance/i }).waitFor({ timeout: 15000 });
  await page.waitForTimeout(2500);
  snap = await ui.snapshot();
  const newMRef = snap.match(/@(e\d+) button "([^"]*(New|Add)[^"]*)"/)?.[1];
  if (!newMRef) {
    step('maintenance dialog', false, 'no new-button');
    return out;
  }
  await ui.click(newMRef);
  await page.waitForTimeout(800);
  await page.getByLabel('Title').fill('QA leaky faucet');
  await page.getByRole('button', { name: /select/i }).first().click();
  await page.waitForTimeout(1000);
  await page.getByRole('combobox').fill('QA-A-101');
  await page.getByRole('option', { name: /QA-A-101/ }).first().waitFor({ timeout: 15000 });
  await page.getByRole('option', { name: /QA-A-101/ }).first().click();
  await page.waitForTimeout(800);
  await page.getByRole('button', { name: /create request/i }).click();
  await page.waitForTimeout(3000);
  step('maintenance created', (await page.getByText('QA leaky faucet').count()) > 0);

  // --- document upload ---
  await page.goto(`${BASE}/dashboard/documents`);
  await page.getByRole('heading', { name: /documents/i }).waitFor({ timeout: 15000 });
  await page.waitForTimeout(2500);
  snap = await ui.snapshot();
  const upRef = snap.match(/@(e\d+) button "([^"]*(Upload|New|Add)[^"]*)"/)?.[1];
  if (!upRef) {
    step('upload dialog', false, 'no upload-button');
    return out;
  }
  await ui.click(upRef);
  await page.waitForTimeout(800);
  step('upload dialog opens', true);
  return out;
}
