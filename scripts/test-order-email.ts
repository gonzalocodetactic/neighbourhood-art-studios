/**
 * Renders the order-confirmation email for a School registration and a Camp
 * registration and checks the new sections (no mail is sent).
 *
 * Usage: DATABASE_URI=file:./payload.db node --require ./src/seed-preload.cjs --require tsx/cjs scripts/test-order-email.ts
 */
import { getPayload } from 'payload'
import config from '../payload.config'
import { buildAdminContactRows, toEmailRegistration } from '../src/emails/sendOrderConfirmation'
import { buildAdminNotificationHtml, buildOrderConfirmationHtml } from '../src/emails/templates'

function assert(cond: unknown, msg: string) {
  if (!cond) { console.error(`❌ ${msg}`); process.exit(1) }
  console.log(`✓ ${msg}`)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function render(data: any) {
  const isCamp = Boolean(data.locationName || data.timeslotLabel || data.campWeekLabel)
  const variation = isCamp
    ? [data.campWeekLabel, data.timeslotLabel, data.locationName].filter(Boolean).join(' · ')
    : [data.schoolName, data.seasonName].filter(Boolean).join(' · ')
  return buildOrderConfirmationHtml({
    heading: 'Registration Confirmed!', intro: 'Thanks', footer: 'Call us',
    parentName: `${data.parentFirstName} ${data.parentLastName}`,
    orderId: data.orderId, productTitle: data.productTitle, programKind: isCamp ? 'camp' : 'school',
    schoolName: data.schoolName, seasonName: data.seasonName,
    locationName: data.locationName, timeslotLabel: data.timeslotLabel, campWeekLabel: data.campWeekLabel,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    students: data.students.map((s: any) => ({
      name: `${s.firstName}${s.lastName ? ' ' + s.lastName : ''}`,
      detail: [s.age ? `Age ${s.age}` : '', s.grade ? `Grade ${s.grade}` : ''].filter(Boolean).join(' · '),
      variation: [data.productTitle, variation].filter(Boolean).join(' — '),
    })),
    unitPrice: data.unitPrice, studentCount: data.studentCount, subtotal: data.subtotal,
    gstAmount: data.gstAmount, totalAmount: data.totalAmount, paymentStatus: data.paymentStatus,
  })
}

async function main() {
  const payload = await getPayload({ config })

  // ── School registration ────────────────────────────────────────────────────
  const schoolReg = (await payload.find({ collection: 'registrations', where: { school: { exists: true } }, limit: 1, depth: 1 })).docs[0]
  assert(schoolReg, 'found a school registration')
  const schoolData = await toEmailRegistration(payload, { ...schoolReg, paymentStatus: 'paid' })
  const schoolHtml = render(schoolData)
  assert(schoolHtml.includes(`Order Reference:`) && schoolHtml.includes(schoolData.orderId!), 'school: Order Reference shown')
  assert(schoolHtml.includes('>School<') && schoolHtml.includes('>Season<'), 'school: School + Season rows')
  assert(!schoolHtml.includes('>Camp Week<') && !schoolHtml.includes('>Location<'), 'school: no camp rows')
  assert(schoolHtml.includes('Paid') && schoolHtml.includes('Price / student') && schoolHtml.includes('Subtotal'), 'school: Paid + price/subtotal')
  assert(/GST \(5%\)/.test(schoolHtml), 'school: GST (5%) row')

  // ── Camp registration (temporary) ──────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const product: any = (await payload.find({ collection: 'products', where: { title: { equals: 'Summer Art Camps 2026' } }, limit: 1, depth: 1 })).docs[0]
  const v = product.variations[0]
  const created = await payload.create({
    collection: 'registrations',
    data: {
      parentFirstName: 'Email', parentLastName: 'Test', parentEmail: 'email-test@example.com', parentPhone: '604-555-0100',
      students: [{ firstName: 'Ann', lastName: '<b>Lee</b>', age: '8', gender: 'Female' }, { firstName: 'Ben', grade: '3', gender: 'Male' }],
      product: product.id, campVariationId: String(v.id),
      unitPrice: 22500, studentCount: 2, subtotal: 45000, gstAmount: 2250, totalAmount: 47250,
      monerisOrderId: 'NAS-TEST-ORDER-1', paymentStatus: 'paid', attendanceStatus: 'enrolled',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any,
  })
  try {
    const full = await payload.findByID({ collection: 'registrations', id: created.id, depth: 1 })
    const campData = await toEmailRegistration(payload, full)
    const html = render(campData)
    assert(html.includes('Order Reference:') && html.includes('NAS-TEST-ORDER-1'), 'camp: Order Reference uses Moneris order id')
    assert(html.includes('>Location<') && html.includes('>Timeslot<') && html.includes('>Camp Week<'), 'camp: Location + Timeslot + Camp Week rows')
    assert(!html.includes('>School<') && !html.includes('>Season<'), 'camp: no school rows')
    assert(html.includes(v.location?.name ?? '') && html.includes(v.campWeek?.label ?? ''), 'camp: variation values resolved')
    assert(html.includes('Ann') && html.includes('Ben') && html.includes('Age 8') && html.includes('Grade 3'), 'camp: students listed with age/grade')
    assert(html.includes('&lt;b&gt;Lee') && !html.includes('<b>Lee'), 'camp: student names HTML-escaped')
    assert(html.includes('$450.00') && html.includes('$472.50') && html.includes('Paid'), 'camp: totals + Paid')
  } finally {
    await payload.delete({ collection: 'registrations', id: created.id }).catch(() => {})
  }
  // ── Admin notification: parent name / phone / email ─────────────────────────
  const adminHtml = buildAdminNotificationHtml({
    title: 'New Registration',
    rows: buildAdminContactRows({ parentFirstName: 'Jane', parentLastName: "O'Doe", parentPhone: '604-555-0100', parentEmail: 'jane@example.com' }),
  })
  assert(adminHtml.includes('Parent Name') && adminHtml.includes('Jane O&#39;Doe') || adminHtml.includes("Jane O'Doe"), 'admin: full parent name rendered')
  assert(adminHtml.includes('>Phone<') && adminHtml.includes('604-555-0100') && adminHtml.includes('>Email<') && adminHtml.includes('jane@example.com'), 'admin: phone + email rendered')
  const labels = buildAdminContactRows({ parentFirstName: 'A', parentLastName: 'B', parentPhone: '1', parentEmail: 'e' }).map((r) => r.label)
  assert(labels.join('|') === 'Contact|Parent Name|Phone|Email', 'admin: contact rows ordered Parent Name, Phone, Email')

  console.log('✅ Order email checks passed')
  process.exit(0)
}
main().catch((e) => { console.error('❌', e); process.exit(1) })
