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
  lastName: string
  age?: string
  gender?: string
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
  emergencyContactName?: string
  emergencyContactPhone?: string
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

    // Fetch registration with populated product/school/season (depth 2)
    const reg = await payload.findByID({
      collection: 'registrations',
      id: registrationId,
      depth: 2,
    })
    if (!reg) return { error: 'Registration not found' }

    // Resolve price from matching product variation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const product = reg.product as any
    const schoolId = String((reg.school as any)?.id ?? reg.school)
    const seasonId = String((reg.season as any)?.id ?? reg.season)
    const variation = (product?.variations ?? []).find((v: any) => {
      const vs  = String(v.school?.id ?? v.school)
      const vss = String(v.season?.id ?? v.season)
      return vs === schoolId && vss === seasonId
    })
    const cents: number = variation?.price ?? 0
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const created = await payload.create({
      collection: 'registrations',
      data: {
        parentFirstName: data.parentFirstName,
        parentLastName: data.parentLastName,
        parentEmail: data.parentEmail,
        parentPhone: data.parentPhone,
        emergencyContactName: data.emergencyContactName,
        emergencyContactPhone: data.emergencyContactPhone,
        students: data.students.map((s) => ({
          firstName: s.firstName,
          lastName: s.lastName,
          ...(s.age    ? { age: s.age }       : {}),
          ...(s.gender ? { gender: s.gender } : {}),
        })),
        school: data.schoolId,
        season: data.seasonId,
        product: data.productId,
        checkoutAnswers: data.checkoutAnswers,
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
