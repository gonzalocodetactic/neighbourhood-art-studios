/**
 * Verifies that a registration with gender: 'Male' can be created without
 * the "Students 1 > Gender is invalid" Payload validation error.
 *
 * Usage: node --require ./src/seed-preload.cjs --require tsx/cjs scripts/test-registration.ts
 */
import { getPayload } from 'payload'
import config from '../payload.config'

async function main() {
  const payload = await getPayload({ config })

  const [schoolsRes, seasonsRes, productsRes] = await Promise.all([
    payload.find({ collection: 'schools', limit: 1, depth: 0 }),
    payload.find({ collection: 'seasons', limit: 1, depth: 0 }),
    payload.find({ collection: 'products', limit: 1, depth: 0 }),
  ])

  const school   = schoolsRes.docs[0]
  const season   = seasonsRes.docs[0]
  const product  = productsRes.docs[0]

  if (!school || !season || !product) {
    console.error('❌ Seed data missing — run seed-test-parent first')
    process.exit(1)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let reg: any
  try {
    reg = await payload.create({
      collection: 'registrations',
      data: {
        parentFirstName: 'Test',
        parentLastName:  'Parent',
        parentEmail:     `test-gender-${Date.now()}@example.com`,
        parentPhone:     '604-555-0100',
        students: [{ firstName: 'TestStudent', gender: 'Male', age: '8' }],
        school:   school.id,
        season:   season.id,
        product:  product.id,
        unitPrice: 18000,
        studentCount: 1,
        subtotal: 18000,
        gstAmount: 900,
        totalAmount: 18900,
        paymentStatus: 'pending',
        attendanceStatus: 'enrolled',
      } as any,
    })
  } catch (err: any) {
    console.error('❌ Registration creation failed:', err?.message ?? err)
    process.exit(1)
  }

  const studentGender = reg?.students?.[0]?.gender
  console.log(`✅ Registration ${reg.id} created — student gender: "${studentGender}"`)

  if (studentGender !== 'Male') {
    console.error(`❌ Expected gender "Male", got "${studentGender}"`)
    await payload.delete({ collection: 'registrations', id: reg.id }).catch(() => {})
    process.exit(1)
  }

  // Cleanup
  await payload.delete({ collection: 'registrations', id: reg.id })
  console.log('✅ Test record cleaned up — gender binding verified')
  process.exit(0)
}

main().catch((err) => {
  console.error('❌ Unexpected error:', err)
  process.exit(1)
})
