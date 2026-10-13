/* QA-B: owner CRUD via UI — property, building, unit (picker), resident (phone+ID validation), lease (pickers). */
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

  // --- property ---
  await page.goto(`${BASE}/dashboard/properties`);
  await page.getByRole('heading', { name: /properties/i }).waitFor({ timeout: 15000 });
  await page.getByRole('button', { name: /new property/i }).click();
  await page.getByLabel('Name').fill('QA Tower Complex');
  await page.getByLabel('City').fill('Cairo');
  await page.getByRole('button', { name: /create property/i }).click();
  await page.waitForTimeout(2500);
  step('property created', (await page.getByText('QA Tower Complex').count()) > 0);

  // --- building on detail page ---
  await page.getByText('QA Tower Complex').first().click();
  await page.waitForTimeout(2000);
  await page.getByRole('button', { name: /new building/i }).click();
  await page.getByLabel('Name').fill('QA Tower A');
  await page.getByLabel('Code').fill('QTA');
  await page.getByRole('button', { name: /create building/i }).click();
  await page.waitForTimeout(2500);
  step('building created', (await page.getByText('QA Tower A').count()) > 0);

  // --- unit with building picker ---
  await page.getByRole('button', { name: /new unit/i }).click();
  await page.waitForTimeout(800);
  // picker button inside unit dialog (shows the placeholder until picked)
  const pickerBtn = page.getByRole('button', { name: /select/i }).first();
  await pickerBtn.click();
  await page.waitForTimeout(1200);
  const searchBox = page.getByRole('combobox');
  await searchBox.fill('QA Tower A');
  await page.waitForTimeout(1500);
  const optCount = await page.getByRole('option', { name: /QA Tower A/ }).count();
  step('unit building picker lists', optCount > 0, `matches=${optCount}`);
  if (optCount > 0) {
    await page.getByRole('option', { name: /QA Tower A/ }).first().click();
    await page.waitForTimeout(500);
  }
  await page.getByLabel('Name').fill('QA-A-101');
  await page.getByLabel('Unit number').fill('101');
  await page.getByLabel('Rent amount').fill('4500');
  await page.getByRole('button', { name: /create unit/i }).click();
  await page.waitForTimeout(2500);
  step('unit created', (await page.getByText('QA-A-101').count()) > 0);

  // --- resident with invalid phone first ---
  await page.goto(`${BASE}/dashboard/residents`);
  await page.getByRole('heading', { name: /residents/i }).waitFor({ timeout: 15000 });
  await page.waitForTimeout(2500);
  const snap = await ui.snapshot();
  const newResRef = snap.match(/@(e\d+) button "([^"]*(New|Add|Invite|Member)[^"]*)"/)?.[1];
  if (!newResRef) {
    step('resident dialog', false, `no new-button. ${snap.slice(0, 200)}`);
    return out;
  }
  await ui.click(newResRef);
  await page.getByLabel('First name').waitFor({ timeout: 10000 });
  await page.getByLabel('First name').fill('QA');
  await page.getByLabel('Last name').fill('Resident');
  const phoneInput = page.locator('#rf-phone');
  if ((await phoneInput.count()) > 0) {
    await phoneInput.fill('12345');
    await page.getByLabel('ID number').fill('123');
    await page.getByRole('button', { name: /create resident/i }).click();
    await page.waitForTimeout(1000);
    const phoneErr = await page.getByText(/valid phone number/i).count();
    const idErr = await page.getByText(/national ID/i).count();
    step('invalid phone+ID rejected inline', phoneErr > 0 && idErr > 0, `phone=${phoneErr} id=${idErr}`);
    await phoneInput.fill('+201001234567');
    await page.getByLabel('ID number').fill('29901011234567');
    await page.getByRole('button', { name: /create resident/i }).click();
    await page.waitForTimeout(2500);
    step('resident created (valid phone+ID)', (await page.getByText('QA Resident').count()) > 0);
  } else {
    step('resident dialog', false, 'no dialog opened');
  }

  return out;
}
