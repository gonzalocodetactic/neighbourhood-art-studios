import { cookies } from 'next/headers'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
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

export default async function StudentListsPage() {
  // ── Auth check ─────────────────────────────────────────────────────────────
  const store = await cookies()
  const expected = process.env.ROSTER_PASSWORD ?? 'art-studios'
  const isAuthed = store.get('roster_auth')?.value === expected

  if (!isAuthed) return <PasswordGate />

  // ── Data fetch ─────────────────────────────────────────────────────────────
  const payload = await getPayload({ config: configPromise })

  const [regsRes, productsRes] = await Promise.all([
    payload.find({
      collection: 'registrations',
      limit: 5000,
      depth: 2, // school → city, season, product populated
      where: {
        and: [
          { attendanceStatus: { not_in: ['cancelled'] } },
          // orderStatus is null on rows created before the field existed
          { or: [{ orderStatus: { exists: false } }, { orderStatus: { not_in: ['cancelled', 'refunded'] } }] },
        ],
      },
      sort: 'createdAt',
    }),
    payload.find({
      collection: 'products',
      limit: 100,
      depth: 2,
    }),
  ])

  // Build product variation lookup: productId → "schoolId-seasonId" → schedule string
  const scheduleMap = new Map<string, Map<string, string>>()
  for (const product of productsRes.docs) {
    const inner = new Map<string, string>()
    for (const v of (product.variations ?? []) as Record<string, unknown>[]) {
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
    const productId   = getId(reg.product)
    const schoolId    = getId(reg.school)
    const seasonId    = getId(reg.season)

    const scheduleDate =
      scheduleMap.get(productId)?.get(`${schoolId}-${seasonId}`) ?? ''

    // One row per student; studentIndex (1, 2, 3…) keeps siblings grouped under the same regId
    ;((reg.students ?? []) as Record<string, unknown>[]).forEach((student, idx) => {
      rows.push({
        regId:           String(reg.id),
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
        // Per-student values first; registration-level fields cover older rows
        divisionNumber:   String(student.divisionNumber || r0.divisionNumber || ''),
        teacherName:      String(student.teacherName    || r0.teacherName    || ''),
        scheduleDate:     String(student.classDate      || r0.classDate      || scheduleDate),
      })
    })
  }

  return <RosterClient rows={rows} />
}
