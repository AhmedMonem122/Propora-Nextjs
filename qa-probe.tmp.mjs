/* QA probe: properties page render. */
export default async function run(page, ui) {
  const out = { steps: [] };
  const step = (n, ok, extra = '') => out.steps.push({ n, ok, extra: String(extra).slice(0, 300) });
  await page.goto('https://propora-nextjs.vercel.app/login');
  await page.getByLabel('Email').fill('qa-owner-mv6qlftl@example.com');
  await page.getByLabel('Password', { exact: true }).fill('Str0ng!Pass123');
  await page.getByRole('button', { name: /^log in$/i }).click();
  await page.waitForURL('**/dashboard**', { timeout: 30000 });
  await page.goto('https://propora-nextjs.vercel.app/dashboard/properties');
  try {
    await page.getByRole('heading', { name: /properties/i }).waitFor({ timeout: 15000 });
    step('properties heading', true);
  } catch (e) {
    step('properties heading', false, String(e).slice(0, 200));
  }
  const snap = await ui.snapshot();
  step('snapshot size', snap.length > 100, `chars=${snap.length}`);
  out.snapshot = snap.slice(0, 2000);
  const body = await page.getByRole('main').innerText().catch((e) => `ERR:${String(e).slice(0, 120)}`);
  out.body = body.slice(0, 600);
  return out;
}
