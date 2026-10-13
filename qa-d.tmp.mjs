/* QA-D: per-role dashboards — nav gating + overview variants. */
export default async function run(page, ui) {
  const out = { roles: {} };
  const BASE = 'https://propora-nextjs.vercel.app';
  const creds = [
    ['accountant', 'qa-acc-mv6qlftl@example.com'],
    ['maintenance', 'qa-mnt-mv6qlftl@example.com'],
    ['staff', 'qa-stf-mv6qlftl@example.com'],
  ];
  for (const [role, email] of creds) {
    const r = { nav: [], overview: '', errors: [] };
    await page.goto(`${BASE}/logout`);
    await page.waitForTimeout(1000);
    await page.goto(`${BASE}/login`);
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password', { exact: true }).fill('TempStr0ng!Pass1');
    await page.getByRole('button', { name: /^log in$/i }).click();
    try {
      await page.waitForURL('**/dashboard**', { timeout: 30000 });
      r.login = true;
    } catch {
      r.login = false;
      out.roles[role] = r;
      continue;
    }
    await page.waitForTimeout(2500);
    const snap = await ui.snapshot();
    r.nav = (snap.match(/link "([^"]+)"/g) ?? []).map((s) => s.slice(6, -1));
    r.overview = (await page.getByRole('main').innerText().catch(() => '')).slice(0, 400);
    out.roles[role] = r;
  }
  return out;
}
