import { cookies, headers } from 'next/headers'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { isStaff } from '@/access'
import PasswordGate from './PasswordGate'
import RosterClient, { type RosterRow } from './RosterClient'

// Safely extract `.id` from a populated relationship or return the raw value
function getId(val: unknown): string {
  if (val && typeof val === 'object' && 'id' in val) return String((val as { id: unknown }).id)
  return String(val ?? '')
}

// Safely extract `.title` from a populated relationship
function getTitle(val: unknown): string {
  if (val && typeof val === 'object' && 'title' in val) return String((val as { title: unknown }).title)
  return ''
}

const ACTIVE_ORDER_STATUSES = ['processing', 'completed']

export default async function StudentListsPage() {
  // ── Auth check ─────────────────────────────────────────────────────────────
  // Signed-in admins (either role) get straight in; others use the shared roster password
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers: await headers() })
  const store = await cookies()
  const expected = process.env.ROSTER_PASSWORD ?? 'art-studios'
  const isAuthed = isStaff(user) || store.get('roster_auth')?.value === expected

  if (!isAuthed) return <PasswordGate />

  // ── Data fetch ─────────────────────────────────────────────────────────────

  const [regsRes, productsRes] = await Promise.all([
    payload.find({
      collection: 'registrations',
      limit: 5000,
      depth: 2, // school → city, season, product populated
      // Inactive orders are still fetched so staff can toggle them on in the client
      where: { attendanceStatus: { not_in: ['cancelled'] } },
      sort: 'createdAt',
    }),
    payload.find({
      collection: 'products',
      limit: 100,
      depth: 2,
    }),
  ])

  // Build product variation lookup: productId → "schoolId-seasonId" → schedule string,
  // plus variation ID → camp location name
  const scheduleMap = new Map<string, Map<string, string>>()
  const campLocationMap = new Map<string, string>()
  for (const product of productsRes.docs) {
    const inner = new Map<string, string>()
    for (const v of (product.variations ?? []) as Record<string, unknown>[]) {
      const location = v.location as Record<string, unknown> | null | undefined
      if (v.id && location && typeof location === 'object') campLocationMap.set(String(v.id), String(location.name ?? ''))
      const schoolId = getId(v.school)
      const seasonId = getId(v.season)
      const parts = [v.dayOfWeek, v.timeSlot].filter(Boolean)
      inner.set(`${schoolId}-${seasonId}`, parts.join(' · '))
    }
    scheduleMap.set(String(product.id), inner)
  }

  // ── Normalise registrations → flat roster rows ─────────────────────────────
  const rows: RosterRow[] = []

  for (const reg of regsRes.docs) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r0 = reg as any
    const parentFirst = r0.parentFirstName ?? ''
    const parentLast  = r0.parentLastName  ?? ''
    const schoolTitle = getTitle(reg.school)
    const cityTitle   = reg.school && typeof reg.school === 'object'
      ? getTitle((reg.school as Record<string, unknown>).city)
      : ''
    const seasonTitle = getTitle(reg.season)
    const productTitle = getTitle(reg.product)
    const productType = reg.product && typeof reg.product === 'object' ? reg.product.productType ?? '' : ''
    const campLocation = campLocationMap.get(String(r0.campVariationId ?? '')) ?? ''
    const productId   = getId(reg.product)
    const schoolId    = getId(reg.school)
    const seasonId    = getId(reg.season)

    const scheduleDate =
      scheduleMap.get(productId)?.get(`${schoolId}-${seasonId}`) ?? ''

    // Active = processing/completed; rows created before orderStatus existed count if paid
    const orderStatus = String(r0.orderStatus ?? '')
    const active = orderStatus
      ? ACTIVE_ORDER_STATUSES.includes(orderStatus)
      : r0.paymentStatus === 'paid'

    // One row per student; studentIndex (1, 2, 3…) keeps siblings grouped under the same regId
    ;((reg.students ?? []) as Record<string, unknown>[]).forEach((student, idx) => {
      rows.push({
        regId:           String(reg.id),
        orderId:         String(r0.legacyWooOrderId ?? ''),
        studentIndex:    String(idx + 1),
        parentFirstName: parentFirst,
        parentLastName:  parentLast,
        phone:           reg.parentPhone ?? '',
        email:           reg.parentEmail ?? '',
        ecName:          [r0.emergencyContactFirstName, r0.emergencyContactLastName].filter(Boolean).join(' ') || '',
        ecPhone:         r0.emergencyContactPhone ?? '',
        studentFirstName: String(student.firstName ?? ''),
        studentLastName:  String(student.lastName  ?? ''),
        gradeAge:         String((student as Record<string, unknown>).age ?? ''),
        gender:           String((student as Record<string, unknown>).gender ?? ''),
        school:           schoolTitle,
        schoolCity:       cityTitle,
        season:           seasonTitle,
        product:          productTitle,
        campLocation,
        productType,
        // Per-student values first; registration-level fields cover older rows
        divisionNumber:   String(student.divisionNumber || r0.divisionNumber || ''),
        teacherName:      String(student.teacherName    || r0.teacherName    || ''),
        scheduleDate:     String(student.classDate      || r0.classDate      || scheduleDate),
        orderStatus:      orderStatus || String(r0.paymentStatus ?? ''),
        active,
      })
    })
  }

  return <RosterClient rows={rows} />
}
