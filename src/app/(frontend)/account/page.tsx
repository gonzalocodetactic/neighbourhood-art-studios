import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import AccountClient from './AccountClient'

export default async function AccountPage() {
  const payload = await getPayload({ config: configPromise })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { user } = await (payload as any).auth({ headers: await headers(), collection: 'parents' })

  if (!user) redirect('/account/login')

  const regsRes = await payload.find({
    collection: 'registrations',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    where: { parent: { equals: (user as any).id } } as any,
    limit: 200,
    depth: 1,
    sort: '-createdAt',
  })

  return (
    <AccountClient
      user={{
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        id: String((user as any).id),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        firstName: (user as any).firstName ?? '',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        lastName: (user as any).lastName ?? '',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        email: (user as any).email ?? '',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        phone: (user as any).phone ?? '',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        billingStreet: (user as any).billingAddress?.street ?? '',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        billingCity: (user as any).billingAddress?.city ?? '',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        billingProvince: (user as any).billingAddress?.province ?? '',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        billingPostalCode: (user as any).billingAddress?.postalCode ?? '',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        savedPaymentToken: (user as any).savedPaymentToken ?? '',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        savedPaymentLast4: (user as any).savedPaymentLast4 ?? '',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        savedPaymentExpiry: (user as any).savedPaymentExpiry ?? '',
      }}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      registrations={(regsRes.docs as any[]).map((r: any) => ({
        id: String(r.id),
        productTitle: typeof r.product === 'object' ? (r.product?.title ?? '') : String(r.product ?? ''),
        productId: typeof r.product === 'object' ? String(r.product?.id ?? '') : String(r.product ?? ''),
        schoolName: typeof r.school === 'object' ? (r.school?.title ?? '') : String(r.school ?? ''),
        seasonName: typeof r.season === 'object' ? (r.season?.title ?? '') : String(r.season ?? ''),
        studentCount: r.studentCount ?? 0,
        unitPrice: r.unitPrice ?? 0,
        subtotal: r.subtotal ?? 0,
        gstAmount: r.gstAmount ?? 0,
        totalAmount: r.totalAmount ?? 0,
        paymentStatus: r.paymentStatus ?? 'pending',
        attendanceStatus: r.attendanceStatus ?? 'enrolled',
        monerisOrderId: r.monerisOrderId ?? '',
        createdAt: r.createdAt ?? '',
        parentFirstName: r.parentFirstName ?? '',
        parentLastName: r.parentLastName ?? '',
        parentEmail: r.parentEmail ?? '',
        parentPhone: r.parentPhone ?? '',
        ecFirstName: r.emergencyContactFirstName ?? '',
        ecLastName: r.emergencyContactLastName ?? '',
        ecPhone: r.emergencyContactPhone ?? '',
        ecEmail: r.emergencyContactEmail ?? '',
        students: Array.isArray(r.students)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ? r.students.map((s: any) => ({
              id: String(s.id ?? ''),
              firstName: s.firstName ?? '',
              lastName: s.lastName ?? '',
              age: s.age ?? '',
              grade: s.grade ?? '',
              teacherName: s.teacherName ?? '',
              divisionNumber: s.divisionNumber ?? '',
            }))
          : [],
      }))}
    />
  )
}
