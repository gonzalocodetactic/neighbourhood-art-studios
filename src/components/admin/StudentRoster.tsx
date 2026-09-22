import type { AdminViewServerProps } from 'payload'
import { StudentRosterClient, type RosterRow } from './StudentRosterClient'

export async function StudentRoster(props: AdminViewServerProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { payload } = props as any

  const result = await payload.find({
    collection: 'registrations',
    limit: 2000,
    depth: 2,
    sort: '-createdAt',
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows: RosterRow[] = result.docs.flatMap((reg: any) => {
    const students = Array.isArray(reg.students) ? reg.students : []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return students.map((s: any) => ({
      // student
      firstName: s.firstName ?? '',
      lastName: s.lastName ?? '',
      age: s.age ?? '',
      grade: s.grade ?? '',
      gender: s.gender ?? '',
      medicalNotes: s.medicalNotes ?? '',
      emergencyContactName: s.emergencyContactName ?? '',
      emergencyContactPhone: s.emergencyContactPhone ?? '',
      // parent
      parentName: [reg.parentFirstName, reg.parentLastName].filter(Boolean).join(' '),
      parentEmail: reg.parentEmail ?? '',
      parentPhone: reg.parentPhone ?? '',
      // order
      orderId: reg.monerisOrderId ?? '',
      legacyWooOrderId: reg.legacyWooOrderId ?? '',
      paymentStatus: reg.paymentStatus ?? 'pending',
      totalAmount: reg.totalAmount ?? null,
      unitPrice: reg.unitPrice ?? null,
      // class
      product: typeof reg.product === 'object' ? (reg.product?.title ?? '') : String(reg.product ?? ''),
      school: typeof reg.school === 'object' ? (reg.school?.title ?? '') : String(reg.school ?? ''),
      classDate: reg.classDate ?? '',
      attendanceStatus: reg.attendanceStatus ?? 'enrolled',
    }))
  })

  return <StudentRosterClient rows={rows} />
}

export default StudentRoster
