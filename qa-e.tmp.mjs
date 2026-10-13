/* QA-E: platform admin flow. */
export default async function run(page, ui) {
  const out = { steps: [] };
  const step = (n, ok, extra = '') => out.steps.push({ n, ok, extra: String(extra).slice(0, 160) });
  const BASE = 'https://propora-nextjs.vercel.app';

  await page.goto(`${BASE}/platform/login`);
  await page.getByLabel('Email').fill('admin@propora.io');
  await page.getByLabel('Password', { exact: true }).fill('admin123456');
  await page.getByRole('button', { name: /sign in to platform/i }).click();
  try {
    await page.waitForURL('**/platform', { timeout: 30000 });
    step('platform login', true);
  } catch {
    step('platform login', false, 'no redirect — wrong password?');
    return out;
  }
  await page.waitForTimeout(2500);
  let snap = await ui.snapshot();
  const links = (snap.match(/link "([^"]+)"/g) ?? []).map((s) => s.slice(6, -1));
  step('platform nav', links.includes('Organizations') && links.includes('Members'), links.join('|').slice(0, 200));

  // organizations page
  await page.goto(`${BASE}/platform/organizations`);
  await page.waitForTimeout(2500);
  snap = await ui.snapshot();
  step('orgs table', /QA Org|Demo Property|Sunrise/i.test(snap), `chars=${snap.length}`);

  // managed users page
  await page.goto(`${BASE}/platform/managed-users`);
  await page.waitForTimeout(2500);
  snap = await ui.snapshot();
  step('managed users table', /qa-owner|owner@demo|admin@propora/i.test(snap), `chars=${snap.length}`);

  // roles viewer needs an org pick — snapshot only
  await page.goto(`${BASE}/platform/roles`);
  await page.waitForTimeout(2500);
  snap = await ui.snapshot();
  step('roles page renders', /organization/i.test(snap), `chars=${snap.length}`);
  return out;
}
