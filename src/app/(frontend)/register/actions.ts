'use server'

import configPromise from '@payload-config'
import { getPayload } from 'payload'

export type WaitlistInput = {
  parentName: string
  parentEmail: string
  parentPhone: string
  studentFirstName: string
  studentLastName: string
  grade: string
  notes?: string
  schoolId: number | string
  seasonId: number | string
  productId: number | string
}

export type Student = {
  firstName: string
  lastName?: string
  age?: string
  gender?: string
  teacherName?: string
  divisionNumber?: string
}

export type CheckoutAnswer = {
  fieldLabel: string
  value: string
}

export type RegistrationInput = {
  parentFirstName: string
  parentLastName: string
  parentEmail: string
  parentPhone: string
  emergencyContactFirstName?: string
  emergencyContactLastName?: string
  emergencyContactPhone?: string
  emergencyContactEmail?: string
  students: Student[]
  schoolId: number | string
  seasonId: number | string
  productId: number | string
  checkoutAnswers: CheckoutAnswer[]
  classDate?: string
}

export async function submitWaitlist(
  data: WaitlistInput,
): Promise<{ success: true; id: number | string } | { success: false; error: string }> {
  try {
    const payload = await getPayload({ config: configPromise })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const created = await payload.create({
      collection: 'waitlist',
      data: {
        parentName: data.parentName,
        parentEmail: data.parentEmail,
        parentPhone: data.parentPhone,
        students: [
          {
            firstName: data.studentFirstName,
            lastName: data.studentLastName,
            grade: data.grade,
          },
        ],
        school: data.schoolId,
        season: data.seasonId,
        product: data.productId,
        status: 'waiting',
        ...(data.notes ? { notes: data.notes } : {}),
      } as any,
    })

    return { success: true, id: created.id }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message }
  }
}

export async function initiateMonerisCheckout(
  registrationId: number | string,
): Promise<{ checkoutUrl: string } | { error: string }> {
  try {
    const payload = await getPayload({ config: configPromise })

    // ── Staging mock payment bypass ───────────────────────────────────────────
    const isMockMode =
      process.env.NEXT_PUBLIC_MONERIS_TEST_MODE === 'true' &&
      process.env.MONERIS_STORE_ID === 'moneristest_store_id'

    if (isMockMode) {
      const orderNo = `NAS-MOCK-${registrationId}-${Date.now()}`

      // Mark registration as paid
      await payload.update({
        collection: 'registrations',
        id: registrationId,
        data: { paymentStatus: 'paid', monerisOrderId: orderNo } as any,
      })

      // Fetch full registration for email and parent linking
      const fullReg = await payload.findByID({ collection: 'registrations', id: registrationId, depth: 1 }) as any

      // Find or create parent account
      let parentId: string | number | null = null
      let isNewParent = false
      let tempPassword: string | undefined
      const existingParents = await payload.find({
        collection: 'parents',
        where: { email: { equals: fullReg.parentEmail } } as any,
        limit: 1,
      })
      if (existingParents.docs.length > 0) {
        parentId = existingParents.docs[0].id
      } else {
        tempPassword = `${fullReg.parentFirstName}${Math.floor(1000 + Math.random() * 9000)}`
        const newParent = await payload.create({
          collection: 'parents',
          data: { email: fullReg.parentEmail, password: tempPassword, firstName: fullReg.parentFirstName, lastName: fullReg.parentLastName, phone: fullReg.parentPhone } as any,
        })
        parentId = newParent.id
        isNewParent = true
      }
      if (parentId) {
        await payload.update({ collection: 'registrations', id: registrationId, data: { parent: parentId } as any })
      }

      // Fire-and-forget emails
      const { sendOrderConfirmation } = await import('@/emails/sendOrderConfirmation')
      sendOrderConfirmation(payload, {
        id: fullReg.id,
        parentFirstName: fullReg.parentFirstName ?? '',
        parentLastName: fullReg.parentLastName ?? '',
        parentEmail: fullReg.parentEmail ?? '',
        parentPhone: fullReg.parentPhone ?? '',
        productTitle: typeof fullReg.product === 'object' ? (fullReg.product?.title ?? '') : '',
        schoolName: typeof fullReg.school === 'object' ? (fullReg.school?.title ?? '') : '',
        seasonName: typeof fullReg.season === 'object' ? (fullReg.season?.title ?? '') : '',
        students: Array.isArray(fullReg.students) ? fullReg.students : [],
        unitPrice: fullReg.unitPrice ?? 0,
        studentCount: fullReg.studentCount ?? 0,
        subtotal: fullReg.subtotal ?? 0,
        gstAmount: fullReg.gstAmount ?? 0,
        totalAmount: fullReg.totalAmount ?? 0,
      }).catch(console.error)
      if (isNewParent && tempPassword) {
        const { sendNewAccount } = await import('@/emails/sendNewAccount')
        sendNewAccount(payload, { firstName: fullReg.parentFirstName, email: fullReg.parentEmail, tempPassword }).catch(console.error)
      }

      const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
      return { checkoutUrl: `${base}/register?payment=success&orderId=${orderNo}` }
    }
    // ── End mock bypass ───────────────────────────────────────────────────────

    // Fetch registration with populated product/school/season (depth 2)
    const reg = await payload.findByID({
      collection: 'registrations',
      id: registrationId,
      depth: 2,
    })
    if (!reg) return { error: 'Registration not found' }

    // Use stored totalAmount (subtotal + GST), computed at submitRegistration time
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cents: number = (reg as any).totalAmount ?? 0
    const amount = (cents / 100).toFixed(2)

    // Fetch global payment settings
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const settings = (await payload.findGlobal({ slug: 'payment-settings' })) as any
    if (!settings?.monerisStoreId || !settings?.monerisApiToken) {
      return { error: 'Payment gateway not configured — contact admin.' }
    }

    const isQA = settings.monerisEnvironment !== 'prod'
    const preloadUrl = isQA
      ? 'https://esqa.moneris.com/api/hpp/v1/preload'
      : 'https://www3.moneris.com/api/hpp/v1/preload'

    const orderNo   = `NAS-${registrationId}-${Date.now()}`
    const baseUrl   = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
    const responseUrl = `${baseUrl}/api/moneris/callback`

    const preloadRes = await fetch(preloadUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        store_id:           settings.monerisStoreId,
        api_token:          settings.monerisApiToken,
        checkout_id:        settings.monerisStoreId,
        txn_total:          amount,
        environment:        isQA ? 'qa' : 'prod',
        action:             'preload',
        order_no:           orderNo,
        cust_id:            String(registrationId),
        dynamic_descriptor: 'NAS Art Class',
        language:           'en',
        response_url:       responseUrl,
      }),
    })

    const data = await preloadRes.json()
    if (String(data.response?.success) !== 'true') {
      return { error: data.response?.error ?? 'Moneris preload failed' }
    }

    // Persist orderNo so the callback can locate this registration
    await payload.update({
      collection: 'registrations',
      id: registrationId,
      data: { monerisOrderId: orderNo } as any,
    })

    const ticket: string = data.response.ticket
    const checkoutUrl = isQA
      ? `https://gatewayt.moneris.com/chkt/request/request.php?id=${ticket}`
      : `https://gateway.moneris.com/chkt/request/request.php?id=${ticket}`

    return { checkoutUrl }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Checkout error'
    return { error: message }
  }
}

export async function submitRegistration(
  data: RegistrationInput,
): Promise<{ success: true; id: number | string } | { success: false; error: string }> {
  try {
    const payload = await getPayload({ config: configPromise })

    // Resolve unitPrice from the matching product variation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const product = await payload.findByID({ collection: 'products', id: data.productId as any, depth: 0 }) as any
    const variations: any[] = product?.variations ?? []
    const variation = variations.find((v: any) =>
      String(v.school?.id ?? v.school) === String(data.schoolId) &&
      String(v.season?.id ?? v.season) === String(data.seasonId),
    )
    const unitPrice: number = Math.round((variation?.price ?? 0) * 100)

    // GST from payment settings
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const settings = (await payload.findGlobal({ slug: 'payment-settings' })) as any
    const gstEnabled: boolean = settings?.gstEnabled ?? true
    const gstRate: number = typeof settings?.gstRate === 'number' ? settings.gstRate : 5
    const studentCount = data.students.length
    const subtotal = unitPrice * studentCount
    const gstAmount = gstEnabled ? Math.round(subtotal * gstRate / 100) : 0
    const totalAmount = subtotal + gstAmount

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const created = await payload.create({
      collection: 'registrations',
      data: {
        parentFirstName: data.parentFirstName,
        parentLastName: data.parentLastName,
        parentEmail: data.parentEmail,
        parentPhone: data.parentPhone,
        emergencyContactFirstName: data.emergencyContactFirstName,
        emergencyContactLastName: data.emergencyContactLastName,
        emergencyContactPhone: data.emergencyContactPhone,
        emergencyContactEmail: data.emergencyContactEmail,
        students: data.students.map((s) => ({
          firstName: s.firstName,
          ...(s.lastName       ? { lastName: s.lastName }             : {}),
          ...(s.age            ? { age: s.age }                       : {}),
          ...(s.gender         ? { gender: s.gender }                 : {}),
          ...(s.teacherName    ? { teacherName: s.teacherName }       : {}),
          ...(s.divisionNumber ? { divisionNumber: s.divisionNumber } : {}),
        })),
        school: data.schoolId,
        season: data.seasonId,
        product: data.productId,
        checkoutAnswers: data.checkoutAnswers,
        unitPrice,
        studentCount,
        subtotal,
        gstAmount,
        totalAmount,
        paymentStatus: 'pending',
        attendanceStatus: 'enrolled',
        ...(data.classDate ? { classDate: data.classDate } : {}),
      } as any,
    })

    return { success: true, id: created.id }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message }
  }
}
