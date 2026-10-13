/* QA probe: lease dialog state after picks. */
export default async function run(page, ui) {
  const out = {};
  await page.goto('https://propora-nextjs.vercel.app/login');
  await page.getByLabel('Email').fill('qa-owner-mv6qlftl@example.com');
  await page.getByLabel('Password', { exact: true }).fill('Str0ng!Pass123');
  await page.getByRole('button', { name: /^log in$/i }).click();
  await page.waitForURL('**/dashboard**', { timeout: 30000 });
  await page.goto('https://propora-nextjs.vercel.app/dashboard/leases');
  await page.getByRole('heading', { name: /leases/i }).waitFor({ timeout: 15000 });
  await page.waitForTimeout(2500);
  let snap = await ui.snapshot();
  const newRef = snap.match(/@(e\d+) button "New lease"/)?.[1];
  out.newRef = newRef ?? null;
  await ui.click(newRef);
  await page.waitForTimeout(1000);
  await page.locator('label:has-text("Unit") + div button').first().click();
  await page.waitForTimeout(1000);
  await page.getByRole('combobox').fill('QA-A-101');
  await page.waitForTimeout(2000);
  const opts = await page.getByRole('option').count();
  out.unitOptions = opts;
  if (opts > 0) {
    await page.getByRole('option').first().click();
    await page.waitForTimeout(800);
  }
  const snap2 = await ui.snapshot();
  out.afterUnitPick = snap2.match(/@(e\d+) button "([^"]*)"/g) ?? [];
  return out;
}
