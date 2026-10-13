/* QA probe: managed-users page content. */
export default async function run(page, ui) {
  const out = {};
  await page.goto('https://propora-nextjs.vercel.app/platform/login');
  await page.getByLabel('Email').fill('admin@propora.io');
  await page.getByLabel('Password', { exact: true }).fill('admin123456');
  await page.getByRole('button', { name: /sign in to platform/i }).click();
  await page.waitForURL('**/platform', { timeout: 30000 });
  await page.goto('https://propora-nextjs.vercel.app/platform/managed-users');
  await page.waitForTimeout(6000);
  out.body = (await page.getByRole('main').innerText().catch(() => 'NO MAIN')).slice(0, 800);
  out.snapshot = (await ui.snapshot()).slice(0, 1200);
  return out;
}
