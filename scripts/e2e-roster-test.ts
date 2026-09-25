/**
 * E2E test — /student-lists sorting, sibling grouping and Copy CSV.
 *
 * Usage: ROSTER_PASSWORD=... npx tsx scripts/e2e-roster-test.ts
 * Requires dev server at http://localhost:3000 and at least one registration
 * with 2+ students in the first non-empty tab.
 */
import { chromium } from 'playwright'

const BASE = 'http://localhost:3000'
const PASSWORD = process.env.ROSTER_PASSWORD ?? 'art-studios'

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg)
  console.log(`✓ ${msg}`)
}

async function run() {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: BASE })
  const page = await context.newPage()
  try {
    await page.goto(`${BASE}/student-lists`, { waitUntil: 'networkidle' })
    if (await page.locator('input[placeholder="Password"]').count()) {
      await page.fill('input[placeholder="Password"]', PASSWORD)
      await page.locator('button[type="submit"], form button').first().click()
      await page.waitForSelector('table', { timeout: 10_000 })
    }
    const column = async (label: string) => {
      const idx = await page.locator('thead th').evaluateAll(
        (ths, l) => ths.findIndex((t) => t.textContent?.replace(/[↑↓]/g, '').trim() === l), label)
      return page.locator('tbody tr').evaluateAll((trs, i) => trs.map((tr) => tr.children[i]?.textContent?.trim() ?? ''), idx)
    }

    // Pick the first tab that contains a multi-student registration (repeated ID)
    const tabs = page.locator('nav button')
    for (let i = 0; i < await tabs.count(); i++) {
      await tabs.nth(i).click()
      await page.waitForTimeout(150)
      const found = await page.locator('tbody tr').count() > 0
      const ids = found ? await column('ID') : []
      if (new Set(ids).size < ids.length) break
    }
    await page.waitForSelector('tbody tr')

    // ── default sort: ID asc, student index ascending within a registration ──
    const ids = (await column('ID')).map(Number)
    const stu = (await column('Stu #')).map(Number)
    assert(ids.every((v, i) => i === 0 || ids[i - 1] <= v), 'default sort is ID ascending')
    assert(ids.every((v, i) => i === 0 || ids[i - 1] !== v || stu[i - 1] + 1 === stu[i]), 'siblings consecutive with studentIndex 1,2,3…')
    assert(ids.some((v, i) => i > 0 && ids[i - 1] === v), 'at least one multi-student registration present')
    assert(await page.locator('thead th', { hasText: 'ID' }).first().locator('text=↑').count() === 1, 'ID header shows ↑')

    // ── click ID → desc ──
    await page.locator('thead th', { hasText: /^ID/ }).click()
    const idsDesc = (await column('ID')).map(Number)
    assert(idsDesc.every((v, i) => i === 0 || idsDesc[i - 1] >= v), 'clicking ID sorts descending')
    assert(await page.locator('thead th', { hasText: 'ID' }).first().locator('text=↓').count() === 1, 'ID header shows ↓')

    // ── sort by SFN ──
    await page.locator('thead th', { hasText: 'SFN #1' }).click()
    const names = await column('SFN #1')
    const sorted = [...names].sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))
    assert(JSON.stringify(names) === JSON.stringify(sorted), 'SFN #1 sorts ascending')

    // ── Copy CSV ──
    await page.locator('button', { hasText: 'Copy CSV' }).click()
    await page.waitForSelector('text=Copied to clipboard!', { timeout: 3000 })
    const clip = await page.evaluate(() => navigator.clipboard.readText())
    const lines = clip.split('\n')
    const cols = lines[0].split('\t')
    assert(cols[0] === 'ID' && cols[1] === 'Stu #', 'clipboard header is tab-separated')
    assert(lines.length - 1 === (await page.locator('tbody tr').count()), 'clipboard rows match visible rows')
    assert(lines[1].split('\t')[cols.indexOf('SFN #1')] === names[0], 'clipboard follows current sort')
    console.log('✅ Roster tests passed')
  } catch (err) {
    console.error('❌ Roster test failed:', err instanceof Error ? err.message : err)
    await browser.close()
    process.exit(1)
  }
  await browser.close()
}

run()
