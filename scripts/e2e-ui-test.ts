/**
 * E2E UI test — registration flow with gender='Male'
 *
 * Verifies that selecting Male gender does not produce a "Gender is invalid"
 * validation error and that the form submits successfully.
 *
 * Usage:  npx tsx scripts/e2e-ui-test.ts
 * Requires dev server running at http://localhost:3000
 */
import { chromium } from 'playwright'

const BASE = 'http://localhost:3000'

async function run() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()

  const consoleErrors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })

  try {
    // ── 1. Load register page ─────────────────────────────────────────────────
    await page.goto(`${BASE}/register`, { waitUntil: 'networkidle' })
    console.log('✓ Page loaded')

    // ── 2. Select city: Burnaby Schools (id=1) ─────────────────────────────────
    await page.selectOption('select', '1')
    await page.waitForSelector('input[placeholder="Type to search schools…"]')
    console.log('✓ City selected: Burnaby Schools')

    // ── 3. Search and pick school: Cameron (id=6) ──────────────────────────────
    const schoolInput = page.locator('input[placeholder="Type to search schools…"]')
    await schoolInput.fill('Cameron')
    await page.waitForSelector('ul li', { timeout: 3000 })
    await page.locator('ul li', { hasText: 'Cameron' }).first().click()
    console.log('✓ School selected: Cameron')

    // ── 4. Programs are shown (season auto-selected by handleSchoolChange) ─────
    await page.waitForSelector('button:has-text("Register Now")', { timeout: 5000 })
    console.log('✓ Programs visible')

    // ── 5. Open registration modal ────────────────────────────────────────────
    await page.locator('button:has-text("Register Now")').first().click()
    await page.waitForSelector('h2:has-text("Register")', { timeout: 3000 })
    console.log('✓ Registration modal opened')

    // ── 6. Fill parent info ───────────────────────────────────────────────────
    await page.locator('input[placeholder="First name *"]').first().fill('Jane')
    await page.locator('input[placeholder="Last name *"]').first().fill('Doe')
    await page.locator('input[placeholder="Email address *"]').fill(`e2e-${Date.now()}@test.example.com`)
    await page.locator('input[placeholder="Phone number *"]').fill('604-555-0100')
    console.log('✓ Parent info filled')

    // ── 7. Fill student fields ─────────────────────────────────────────────────
    // Student first name is the second "First name *" input (inside the student block)
    await page.locator('input[placeholder="First name *"]').nth(1).fill('TestStudent')

    // Fill all per-student dynamic fields by their labels
    const fillByLabel = async (labelText: string, value: string) => {
      const label = page.locator('label', { hasText: labelText }).first()
      if (await label.count() === 0) return
      const parent = label.locator('..')
      const input = parent.locator('input, select').first()
      const tag = await input.evaluate((el) => el.tagName.toLowerCase())
      if (tag === 'select') {
        await input.selectOption(value)
      } else {
        await input.fill(value)
      }
    }

    await fillByLabel('Age', '9')

    // Gender select — must be 'Male' (exact schema value)
    const genderSelect = page.locator('label', { hasText: 'Gender' }).first().locator('..').locator('select')
    await genderSelect.selectOption('Male')
    const selectedGender = await genderSelect.inputValue()
    if (selectedGender !== 'Male') {
      throw new Error(`Gender binding failed — expected "Male", got "${selectedGender}"`)
    }
    console.log(`✓ Gender set to: ${selectedGender}`)

    await fillByLabel('Teacher Name', 'Ms. Smith')
    await fillByLabel('Division', '4')

    console.log('✓ Student per-student fields filled (age=9, gender=Male, teacher=Ms. Smith, div=4)')

    // ── 8. Agree to terms ─────────────────────────────────────────────────────
    await page.locator('input[type="checkbox"]').first().check()
    console.log('✓ Terms accepted')

    // ── 9. Submit ─────────────────────────────────────────────────────────────
    await page.locator('button[type="submit"]').click()
    console.log('✓ Submit button clicked — waiting for result…')

    // ── 10. Wait for outcome (up to 20 s) ────────────────────────────────────
    // Poll every 250 ms for success banner, error message, or redirect
    let outcome: string | null = null
    const deadline = Date.now() + 20_000
    while (!outcome && Date.now() < deadline) {
      await page.waitForTimeout(250)

      const url = page.url()
      if (/payment=success/.test(url)) {
        outcome = 'payment-success'
        break
      }

      // Check for success banner
      if (await page.locator('text=Registration Submitted').count() > 0) {
        outcome = 'success-banner'
        break
      }

      // Check for any validation error
      const errorEl = page.locator('.text-red-600')
      if (await errorEl.count() > 0) {
        const errorText = await errorEl.first().textContent()
        outcome = `error:${errorText?.trim()}`
        break
      }
    }

    if (!outcome) {
      throw new Error('No outcome after 20 s — form may be stuck or server is slow')
    }
    if (outcome.startsWith('error:')) {
      const msg = outcome.slice(6)
      throw new Error(`Validation error appeared: "${msg}"`)
    }

    console.log(`✅ Test passed — outcome: ${outcome}`)
  } catch (err) {
    console.error('❌ Test failed:', err instanceof Error ? err.message : err)
    if (consoleErrors.length) {
      console.error('   Browser console errors:', consoleErrors.slice(0, 5).join('\n   '))
    }
    await page.screenshot({ path: '/tmp/e2e-failure.png', fullPage: false })
    console.error('   Screenshot saved to /tmp/e2e-failure.png')
    await browser.close()
    process.exit(1)
  }

  await browser.close()
  process.exit(0)
}

run()
