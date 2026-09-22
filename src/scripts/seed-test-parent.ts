/**
 * Seed a demo parent account with a mock registration for local testing.
 *
 * Usage: npx tsx src/scripts/seed-test-parent.ts
 *
 * Creates:
 *   parent@example.com / Password123!
 *   1 registration — 2 students (Arin & Maya) — $180/student + 5% GST
 */

import { getPayload } from 'payload'
import config from '../../payload.config'

const DEMO_EMAIL = 'parent@example.com'
const DEMO_PASSWORD = 'Password123!'

async function ensureCity(payload: Awaited<ReturnType<typeof getPayload>>) {
  const res = await payload.find({ collection: 'cities', limit: 1 })
  if (res.docs[0]) return res.docs[0]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return payload.create({ collection: 'cities', data: { title: 'White Rock / South Surrey' } as any })
}

async function ensureSchool(payload: Awaited<ReturnType<typeof getPayload>>, cityId: number | string) {
  const res = await payload.find({ collection: 'schools', limit: 1 })
  if (res.docs[0]) return res.docs[0]
  return payload.create({
    collection: 'schools',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: { title: 'Semiahmoo Elementary', city: cityId } as any,
  })
}

async function ensureSeason(payload: Awaited<ReturnType<typeof getPayload>>) {
  const res = await payload.find({ collection: 'seasons', limit: 1, where: { active: { equals: true } } })
  if (res.docs[0]) return res.docs[0]
  const any = await payload.find({ collection: 'seasons', limit: 1 })
  if (any.docs[0]) return any.docs[0]
  return payload.create({
    collection: 'seasons',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: { title: 'Fall 2025', active: true } as any,
  })
}

async function ensureProduct(
  payload: Awaited<ReturnType<typeof getPayload>>,
  cityId: number | string,
  schoolId: number | string,
  seasonId: number | string,
) {
  const res = await payload.find({ collection: 'products', limit: 1 })
  if (res.docs[0]) return res.docs[0]
  return payload.create({
    collection: 'products',
    data: {
      title: 'After School Art Program',
      variations: [{ city: cityId, school: schoolId, season: seasonId, price: 180, capacity: 20 }],
    } as any,
  })
}

async function main() {
  const payload = await getPayload({ config })

  // ── Parent ────────────────────────────────────────────────────────────────
  let parent: any
  const existing = await payload.find({
    collection: 'parents',
    where: { email: { equals: DEMO_EMAIL } },
    limit: 1,
  })

  if (existing.docs.length > 0) {
    parent = existing.docs[0]
    console.log(`[skip] parent already exists → id ${parent.id}`)
  } else {
    parent = await payload.create({
      collection: 'parents',
      data: {
        firstName: 'Demo',
        lastName: 'Parent',
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
        phone: '604-555-0100',
        lastLoginAt: new Date().toISOString(),
      } as any,
    })
    console.log(`[+] parent created → id ${parent.id}  (${DEMO_EMAIL} / ${DEMO_PASSWORD})`)
  }

  // ── Lookup / create supporting records ───────────────────────────────────
  const city = await ensureCity(payload)
  const school = await ensureSchool(payload, city.id)
  const season = await ensureSeason(payload)
  const product = await ensureProduct(payload, city.id, school.id, season.id)

  // ── Mock registration ─────────────────────────────────────────────────────
  const existing_reg = await payload.find({
    collection: 'registrations',
    where: {
      and: [
        { parent: { equals: parent.id } },
        { paymentStatus: { equals: 'paid' } },
      ],
    } as any,
    limit: 1,
  })

  if (existing_reg.docs.length > 0) {
    console.log(`[skip] mock registration already exists → id ${existing_reg.docs[0].id}`)
  } else {
    // $180/student × 2 students = $360 + 5% GST ($18) = $378 total (all in cents)
    const unitPrice = 18000   // $180.00 per student
    const studentCount = 2
    const subtotal = unitPrice * studentCount  // 36000
    const gstAmount = Math.round(subtotal * 5 / 100)  // 1800
    const totalAmount = subtotal + gstAmount  // 37800

    const reg = await payload.create({
      collection: 'registrations',
      data: {
        parentFirstName: parent.firstName,
        parentLastName: parent.lastName,
        parentEmail: DEMO_EMAIL,
        parentPhone: parent.phone ?? '604-555-0100',
        students: [
          { firstName: 'Arin', lastName: 'Demo', age: '9', grade: 'Grade 4' },
          { firstName: 'Maya', lastName: 'Demo', age: '7', grade: 'Grade 2' },
        ],
        school: school.id,
        season: season.id,
        product: product.id,
        parent: parent.id,
        unitPrice,
        studentCount,
        subtotal,
        gstAmount,
        totalAmount,
        paymentStatus: 'paid',
        attendanceStatus: 'enrolled',
        monerisOrderId: `NAS-DEMO-${Date.now()}`,
      } as any,
    })
    console.log(`[+] mock registration → id ${reg.id}  ($${(totalAmount / 100).toFixed(2)} CAD)`)
  }

  console.log('\nDone. Login at /account/login with:')
  console.log(`  Email:    ${DEMO_EMAIL}`)
  console.log(`  Password: ${DEMO_PASSWORD}`)
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
