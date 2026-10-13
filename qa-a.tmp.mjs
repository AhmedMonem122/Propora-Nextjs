/* QA-A: owner login, nav recon, create property/building/unit/resident/lease via UI. */
export default async function run(page, ui) {
  const out = { steps: [], errors: [] };
  const step = (n, ok, extra = '') => out.steps.push({ n, ok, extra: String(extra).slice(0, 120) });
  const EMAIL = 'qa-owner-mv6qlftl@example.com';
  const PASS = 'Str0ng!Pass123';

  await page.goto('https://propora-nextjs.vercel.app/login');
  await page.getByLabel('Email').fill(EMAIL);
  await page.getByLabel('Password', { exact: true }).fill(PASS);
  await page.getByRole('button', { name: /^log in$/i }).click();
  try {
    await page.waitForURL('**/dashboard**', { timeout: 30000 });
    step('owner login', true);
  } catch (e) {
    step('owner login', false, String(e).slice(0, 120));
    return out;
  }

  // nav recon
  const nav = await ui.snapshot();
  const navLabels = [...nav.matchAll(/link "([^"]+)"/g)].map((m) => m[1]);
  step('nav snapshot', true, navLabels.join('|').slice(0, 200));

  // overview content
  const dashText = await page.getByRole('main').innerText().catch(() => '');
  step('overview renders', /overview|portfolio|operations/i.test(dashText), dashText.slice(0, 120));

  // create property
  await page.goto('https://propora-nextjs.vercel.app/dashboard/properties');
  await page.waitForTimeout(1500);
  let snap = await ui.snapshot();
  const newPropRef = snap.match(/@(e\d+) button "New property"/)?.[1]
    ?? snap.match(/@(e\d+) button "Add property"/)?.[1]
    ?? snap.match(/@(e\d+) button "[^"]*[Pp]roperty[^"]*"/)?.[1];
  if (!newPropRef) {
    step('property dialog opens', false, `no new-button. snap:${snap.slice(0, 300)}`);
    out.navSnapshot = snap;
    return out;
  }
  await ui.click(newPropRef);
  await page.waitForTimeout(800);
  await page.getByLabel('Name').fill('QA Tower Complex');
  await page.getByLabel('City').fill('Cairo');
  const createBtn = page.getByRole('button', { name: /create property/i });
  if ((await createBtn.count()) === 0) {
    step('property create btn', false, 'not found');
    return out;
  }
  await createBtn.first().click();
  await page.waitForTimeout(2500);
  const propRow = await page.getByText('QA Tower Complex').count();
  step('property created + listed', propRow > 0, `rows=${propRow}`);

  return out;
}
