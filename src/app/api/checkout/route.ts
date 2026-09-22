import { NextRequest, NextResponse } from 'next/server'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

type Student = {
  firstName: string
  lastName?: string
  age?: string
  grade?: string
  gender?: string
  medicalNotes?: string
  emergencyContactName?: string
  emergencyContactPhone?: string
  teacherName?: string
  divisionNumber?: string
}

type CheckoutBody = {
  productId: number | string
  schoolId: number | string
  seasonId: number | string
  classDate?: string
  parentFirstName: string
  parentLastName: string
  parentEmail: string
  parentPhone: string
  emergencyContactFirstName?: string
  emergencyContactLastName?: string
  emergencyContactPhone?: string
  emergencyContactEmail?: string
  students: Student[]
  checkoutAnswers?: { fieldLabel: string; value: string }[]
}

function generateOrderId(registrationId: number | string): string {
  return `NAS-${Date.now()}-${registrationId}`
}

export async function POST(request: NextRequest) {
  let body: CheckoutBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const {
    productId, schoolId, seasonId, classDate,
    parentFirstName, parentLastName, parentEmail, parentPhone,
    emergencyContactFirstName, emergencyContactLastName, emergencyContactPhone, emergencyContactEmail,
    students, checkoutAnswers,
  } = body

  if (!productId || !schoolId || !seasonId) {
    return NextResponse.json({ error: 'productId, schoolId, and seasonId are required' }, { status: 400 })
  }
  if (!Array.isArray(students) || students.length === 0) {
    return NextResponse.json({ error: 'At least one student is required' }, { status: 400 })
  }
  if (!parentFirstName || !parentLastName || !parentEmail || !parentPhone) {
    return NextResponse.json({ error: 'Parent contact fields are required' }, { status: 400 })
  }

  try {
    const payload = await getPayload({ config: configPromise })

    // Resolve unit price from the matching product variation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const product = await payload.findByID({ collection: 'products', id: productId as any, depth: 0 }) as any
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

    const variations: any[] = product.variations ?? []
    const variation = variations.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (v: any) =>
        String(v.school?.id ?? v.school) === String(schoolId) &&
        String(v.season?.id ?? v.season) === String(seasonId),
    )

    const unitPrice: number = variation?.price ?? 0
    const studentCount = students.length
    const totalAmount = unitPrice * studentCount

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const reg = await payload.create({
      collection: 'registrations',
      data: {
        parentFirstName,
        parentLastName,
        parentEmail,
        parentPhone,
        emergencyContactFirstName: emergencyContactFirstName ?? '',
        emergencyContactLastName: emergencyContactLastName ?? '',
        emergencyContactPhone: emergencyContactPhone ?? '',
        emergencyContactEmail: emergencyContactEmail ?? '',
        students,
        school: schoolId,
        season: seasonId,
        product: productId,
        classDate: classDate ?? '',
        checkoutAnswers: checkoutAnswers ?? [],
        unitPrice,
        studentCount,
        totalAmount,
        paymentStatus: 'pending',
        attendanceStatus: 'enrolled',
      } as any,
    }) as any

    const monerisOrderId = generateOrderId(reg.id)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await payload.update({ collection: 'registrations', id: reg.id, data: { monerisOrderId } as any })

    return NextResponse.json({
      registrationId: reg.id,
      monerisOrderId,
      unitPrice,
      studentCount,
      totalAmount,
    })
  } catch (err) {
    console.error('[api/checkout]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
