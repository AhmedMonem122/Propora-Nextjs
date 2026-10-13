/* QA probe: lease dialog buttons. */
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
  const snap = await ui.snapshot();
  const newLeaseRef = snap.match(/@(e\d+) button "([^"]*)"/g)?.filter((s) => /new|add|create/i.test(s));
  out.newButtons = newLeaseRef ?? [];
  if (newLeaseRef && newLeaseRef.length > 0) {
    const ref = newLeaseRef[0].match(/@(e\d+)/)?.[1];
    await ui.click(ref);
    await page.waitForTimeout(1200);
    const dlg = await ui.snapshot();
    out.dialogButtons = dlg.match(/@(e\d+) button "([^"]*)"/g) ?? [];
  }
  return out;
}
