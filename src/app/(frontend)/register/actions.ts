'use server'

import configPromise from '@payload-config'
import { getPayload } from 'payload'

export type Student = {
  firstName: string
  lastName: string
  dateOfBirth?: string
  grade?: string
  medicalNotes?: string
}

export type CheckoutAnswer = {
  fieldLabel: string
  value: string
}

export type RegistrationInput = {
  parentName: string
  parentEmail: string
  parentPhone: string
  students: Student[]
  schoolId: number | string
  seasonId: number | string
  productId: number | string
  checkoutAnswers: CheckoutAnswer[]
}

export async function submitRegistration(
  data: RegistrationInput,
): Promise<{ success: true; id: number | string } | { success: false; error: string }> {
  try {
    const payload = await getPayload({ config: configPromise })

    const created = await payload.create({
      collection: 'registrations',
      data: {
        parentName: data.parentName,
        parentEmail: data.parentEmail,
        parentPhone: data.parentPhone,
        students: data.students.map((s) => ({
          firstName: s.firstName,
          lastName: s.lastName,
          ...(s.dateOfBirth ? { dateOfBirth: s.dateOfBirth } : {}),
          ...(s.grade ? { grade: s.grade } : {}),
          ...(s.medicalNotes ? { medicalNotes: s.medicalNotes } : {}),
        })),
        school: data.schoolId,
        season: data.seasonId,
        product: data.productId,
        checkoutAnswers: data.checkoutAnswers,
        paymentStatus: 'pending',
        attendanceStatus: 'enrolled',
      },
    })

    return { success: true, id: created.id }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message }
  }
}
