import type { CollectionConfig } from 'payload'
import { staffCrud } from '../access'

export const Registrations: CollectionConfig = {
  slug: 'registrations',
  access: staffCrud,
  admin: {
    group: 'Main',
    useAsTitle: 'parentFirstName',
    defaultColumns: ['id', 'parentFirstName', 'parentLastName', 'parentEmail', 'product', 'studentCount', 'totalAmount', 'paymentStatus', 'orderStatus', 'attendanceStatus', 'createdAt', 'monerisOrderId'],
  },
  hooks: {
    afterChange: [
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async ({ doc, req }: any) => {
        const parentId = doc.parent
          ? (typeof doc.parent === 'object' ? doc.parent.id : doc.parent)
          : null
        if (!parentId) return
        try {
          const allRegs = await req.payload.find({
            collection: 'registrations',
            where: { parent: { equals: parentId } },
            limit: 2000,
            depth: 0,
            sort: '-createdAt',
          })

          const registrationCount = allRegs.totalDocs

          const totalSpentCents = (allRegs.docs as any[])
            .filter((r: any) => r.paymentStatus === 'paid')
            .reduce((sum: number, r: any) => sum + (r.totalAmount ?? 0), 0)
          const totalSpent = Math.round(totalSpentCents) / 100

          const names = new Set<string>()
          for (const reg of allRegs.docs as any[]) {
            if (Array.isArray(reg.students)) {
              for (const s of reg.students as any[]) {
                if (s.firstName) names.add(s.firstName)
              }
            }
          }
          const childrenSummary = [...names].join(', ')

          const sixMonthsAgo = new Date()
          sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
          const accountStatus = (allRegs.docs as any[]).some(
            (r: any) => new Date(r.createdAt) > sixMonthsAgo,
          ) ? 'active' : 'lapsed'

          await req.payload.update({
            collection: 'parents',
            id: parentId,
            data: { registrationCount, totalSpent, childrenSummary, accountStatus } as any,
          })
        } catch { /* silent — derived field sync is non-critical */ }
      },
    ],
    beforeChange: [
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ({ data, originalDoc }: any) => {
        const students = Array.isArray(data.students) ? data.students
          : Array.isArray(originalDoc?.students) ? originalDoc.students : []
        const count = students.length > 0 ? students.length : (data.studentCount ?? originalDoc?.studentCount ?? 0)
        data.studentCount = count

        const unitPrice: number = data.unitPrice ?? originalDoc?.unitPrice ?? 0
        const subtotal = unitPrice * count
        data.subtotal = subtotal

        // gstAmount is set externally (by checkout); keep existing value for partial updates
        const gstAmount: number = data.gstAmount ?? originalDoc?.gstAmount ?? 0
        data.totalAmount = subtotal + gstAmount

        return data
      },
    ],
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'parentFirstName',
          type: 'text',
          label: 'Parent / Guardian First Name',
          required: true,
        },
        {
          name: 'parentLastName',
          type: 'text',
          label: 'Parent / Guardian Last Name',
          required: true,
        },
      ],
    },
    {
      name: 'parentEmail',
      type: 'email',
      required: true,
    },
    {
      name: 'parentPhone',
      type: 'text',
      required: true,
    },
    {
      type: 'row',
      fields: [
        {
          name: 'emergencyContactFirstName',
          type: 'text',
          label: 'Emergency Contact First Name',
        },
        {
          name: 'emergencyContactLastName',
          type: 'text',
          label: 'Emergency Contact Last Name',
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'emergencyContactPhone',
          type: 'text',
          label: 'Emergency Contact Phone',
        },
        {
          name: 'emergencyContactEmail',
          type: 'email',
          label: 'Emergency Contact Email',
        },
      ],
    },
    {
      name: 'students',
      type: 'array',
      label: 'Student(s)',
      minRows: 1,
      fields: [
        {
          name: 'firstName',
          type: 'text',
          required: true,
        },
        {
          name: 'lastName',
          type: 'text',
        },
        {
          name: 'age',
          type: 'text',
          label: 'Age',
          admin: { placeholder: 'e.g. 8' },
        },
        {
          name: 'grade',
          type: 'text',
          label: 'Grade',
          admin: { placeholder: 'e.g. Grade 3' },
        },
        {
          name: 'gender',
          type: 'select',
          label: 'Gender',
          options: [
            { label: 'Male', value: 'Male' },
            { label: 'Female', value: 'Female' },
            { label: 'Rather Not Say', value: 'Rather Not Say' },
          ],
        },
        {
          name: 'medicalNotes',
          type: 'textarea',
          label: 'Medical / Allergy Notes',
          admin: { placeholder: 'e.g. Nut allergy — carries EpiPen' },
        },
        {
          name: 'emergencyContactName',
          type: 'text',
          label: 'Emergency Contact Name',
          admin: { placeholder: 'e.g. Bob Doe' },
        },
        {
          name: 'emergencyContactPhone',
          type: 'text',
          label: 'Emergency Contact Phone',
          admin: { placeholder: 'e.g. 604-555-0200' },
        },
        {
          name: 'teacherName',
          type: 'text',
          label: 'Teacher Name',
          admin: { placeholder: 'e.g. Ms. Johnson' },
        },
        {
          name: 'divisionNumber',
          type: 'text',
          label: 'Division Number',
          admin: { placeholder: 'e.g. Div. 4' },
        },
        {
          name: 'classDate',
          type: 'text',
          label: 'Class Date',
          admin: { placeholder: 'e.g. Oct 13 – Dec 15' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'school',
          type: 'relationship',
          relationTo: 'schools',
        },
        {
          name: 'season',
          type: 'relationship',
          relationTo: 'seasons',
        },
        {
          name: 'product',
          type: 'relationship',
          relationTo: 'products',
          required: true,
        },
      ],
    },
    {
      name: 'campVariationId',
      type: 'text',
      label: 'Camp Variation ID',
      admin: {
        description: 'ID of the product variation row (location / timeslot / week) for camp registrations.',
      },
    },
    {
      name: 'classDate',
      type: 'text',
      label: 'Class Date / Schedule',
      admin: {
        description: 'Pre-filled from the product variation schedule (e.g. Tuesday · 3:30 PM).',
      },
    },
    {
      name: 'monerisOrderId',
      type: 'text',
      label: 'Moneris Order ID',
      admin: {
        description: 'Set automatically when payment is initiated.',
        readOnly: true,
      },
    },
    {
      name: 'legacyWooOrderId',
      type: 'text',
      label: 'Legacy WooCommerce Order ID',
      admin: {
        description: 'Original WooCommerce order ID for orders migrated from the old site.',
        readOnly: true,
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'unitPrice',
          type: 'number',
          label: 'Unit Price (CAD cents)',
          admin: {
            description: 'Price per student in CAD cents (e.g. 18000 = $180.00). Set from product variation at checkout.',
            readOnly: true,
          },
        },
        {
          name: 'studentCount',
          type: 'number',
          label: 'Student Count',
          admin: {
            description: 'Auto-calculated from the number of students in this registration.',
            readOnly: true,
          },
        },
        {
          name: 'subtotal',
          type: 'number',
          label: 'Subtotal (CAD cents)',
          admin: {
            description: 'Auto-calculated: unitPrice × studentCount (before tax).',
            readOnly: true,
          },
        },
        {
          name: 'gstAmount',
          type: 'number',
          label: 'GST Amount (CAD cents)',
          admin: {
            description: 'GST charged on this order, in CAD cents.',
            readOnly: true,
          },
        },
        {
          name: 'totalAmount',
          type: 'number',
          label: 'Total Amount (CAD cents)',
          admin: {
            description: 'Auto-calculated: subtotal + gstAmount.',
            readOnly: true,
            components: {
              Cell: '@/components/admin/TotalAmountCell',
            },
          },
        },
      ],
    },
    {
      name: 'checkoutAnswers',
      type: 'array',
      label: 'Checkout Field Answers',
      admin: {
        description: "Answers to the product's required checkout questions.",
      },
      fields: [
        {
          name: 'fieldLabel',
          type: 'text',
        },
        {
          name: 'value',
          type: 'text',
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'divisionNumber',
          type: 'text',
          label: 'Division Number',
          admin: {
            description: 'Set by the school after scheduling (e.g. Div. 4).',
          },
        },
        {
          name: 'teacherName',
          type: 'text',
          label: 'Teacher Name',
          admin: {
            description: 'Classroom teacher assigned to this registration.',
          },
        },
      ],
    },
    {
      name: 'parent',
      type: 'relationship',
      relationTo: 'parents',
      label: 'Parent Account',
      admin: {
        description: 'Auto-linked to a parent account if one exists for this email.',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'paymentStatus',
          type: 'select',
          required: true,
          defaultValue: 'pending',
          options: [
            { label: 'Pending', value: 'pending' },
            { label: 'Paid', value: 'paid' },
            { label: 'Refunded', value: 'refunded' },
            { label: 'Waived', value: 'waived' },
          ],
        },
        {
          name: 'attendanceStatus',
          type: 'select',
          required: true,
          defaultValue: 'enrolled',
          options: [
            { label: 'Enrolled', value: 'enrolled' },
            { label: 'Attended', value: 'attended' },
            { label: 'No Show', value: 'no-show' },
            { label: 'Cancelled', value: 'cancelled' },
          ],
        },
        {
          name: 'orderStatus',
          type: 'select',
          defaultValue: 'completed',
          options: [
            { label: 'Pending Payment / Draft', value: 'pending' },
            { label: 'Processing', value: 'processing' },
            { label: 'Completed', value: 'completed' },
            { label: 'On Hold', value: 'on_hold' },
            { label: 'Cancelled', value: 'cancelled' },
            { label: 'Refunded', value: 'refunded' },
            { label: 'Failed', value: 'failed' },
          ],
        },
      ],
    },
    {
      name: 'notes',
      type: 'array',
      label: 'Order Notes',
      fields: [
        {
          name: 'note',
          type: 'textarea',
          required: true,
        },
        {
          type: 'row',
          fields: [
            {
              name: 'timestamp',
              type: 'date',
              admin: { date: { pickerAppearance: 'dayAndTime' } },
            },
            {
              name: 'type',
              type: 'select',
              defaultValue: 'system',
              options: [
                { label: 'System', value: 'system' },
                { label: 'Payment', value: 'payment' },
                { label: 'Admin', value: 'admin' },
              ],
            },
          ],
        },
      ],
    },
  ],
}
