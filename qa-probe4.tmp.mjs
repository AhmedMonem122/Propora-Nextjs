/* QA probe: full lease flow with pre-click dump. */
export default async function run(page, ui) {
  const out = { picks: {} };
  await page.goto('https://propora-nextjs.vercel.app/login');
  await page.getByLabel('Email').fill('qa-owner-mv6qlftl@example.com');
  await page.getByLabel('Password', { exact: true }).fill('Str0ng!Pass123');
  await page.getByRole('button', { name: /^log in$/i }).click();
  await page.waitForURL('**/dashboard**', { timeout: 30000 });
  await page.goto('https://propora-nextjs.vercel.app/dashboard/leases');
  await page.getByRole('heading', { name: /leases/i }).waitFor({ timeout: 15000 });
  await page.waitForTimeout(2500);
  let snap = await ui.snapshot();
  await ui.click(snap.match(/@(e\d+) button "New lease"/)?.[1]);
  await page.waitForTimeout(800);
  await page.locator('label:has-text("Unit") + div button').first().click();
  await page.waitForTimeout(1000);
  await page.getByRole('combobox').fill('QA-A-101');
  await page.waitForTimeout(2000);
  out.unitOpts = await page.getByRole('option').count();
  if (out.unitOpts > 0) await page.getByRole('option').first().click();
  await page.waitForTimeout(800);
  await page.locator('label:has-text("Resident") + div button').first().click();
  await page.waitForTimeout(1000);
  await page.getByRole('combobox').fill('QA Resident');
  await page.waitForTimeout(2000);
  out.resOpts = await page.getByRole('option').count();
  if (out.resOpts > 0) await page.getByRole('option').first().click();
  await page.waitForTimeout(800);
  await page.getByLabel('Start date').fill('2026-01-01');
  await page.getByLabel('Rent amount').fill('4500');
  const snap2 = await ui.snapshot();
  out.preClickButtons = snap2.match(/@(e\d+) button "([^"]*)"/g) ?? [];
  out.dialogs = (snap2.match(/dialog/gi) ?? []).length;
  return out;
}
