import { getPayload } from 'payload'
import config from '../payload.config'

async function main() {
  const payload = await getPayload({ config })

  const existing = await payload.find({
    collection: 'forms',
    where: { title: { equals: 'Contact Us' } },
    limit: 1,
  })

  if (existing.docs.length > 0) {
    console.log(`[skip] "Contact Us" form already exists (id ${existing.docs[0].id})`)
    process.exit(0)
  }

  const form = await payload.create({
    collection: 'forms',
    data: {
      title: 'Contact Us',
      formType: 'general',
      fields: [
        { name: 'name',    label: 'Name',    fieldType: 'text',     required: true,  placeholder: 'Your full name' },
        { name: 'email',   label: 'Email',   fieldType: 'email',    required: true,  placeholder: 'you@example.com' },
        { name: 'subject', label: 'Subject', fieldType: 'text',     required: false, placeholder: 'What is this about?' },
        { name: 'message', label: 'Message', fieldType: 'textarea', required: true,  placeholder: 'Tell us how we can help…' },
      ],
      submitButtonText: 'Send Message',
      successMessage: "Thank you! We'll be in touch within 1–2 business days.",
    } as any,
  })

  console.log(`[+] Created "Contact Us" form (id ${form.id})`)
  process.exit(0)
}

main().catch((e) => { console.error(e); process.exit(1) })
