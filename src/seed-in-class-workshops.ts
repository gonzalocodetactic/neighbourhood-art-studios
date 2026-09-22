import { getPayload } from 'payload'
import config from '../payload.config'

const BASE = 'https://neighbourhoodartstudios.com/wp-content/uploads/2025/10/'
const WS_IMAGES = Array.from({ length: 10 }, (_, i) => ({
  url: `${BASE}WhatsApp-Image-2025-10-02-at-4.49.32-PM-${i + 1}-copy-600x400.jpg`,
  name: `ws-${i + 1}.jpg`,
  alt: `In-class workshop photo ${i + 1}`,
}))

async function upload(payload: Awaited<ReturnType<typeof getPayload>>, img: { url: string; name: string; alt: string }) {
  const hit = await payload.find({ collection: 'media', where: { filename: { equals: img.name } }, limit: 1 })
  if (hit.docs.length) { process.stdout.write('.'); return hit.docs[0].id as number }
  const res = await fetch(img.url)
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${img.url}`)
  const data = Buffer.from(await res.arrayBuffer())
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc = await payload.create({ collection: 'media', data: { alt: img.alt }, file: { data, mimetype: 'image/jpeg', name: img.name, size: data.byteLength } as any })
  process.stdout.write('+')
  return doc.id as number
}

async function main() {
  const payload = await getPayload({ config })

  process.stdout.write('Uploading workshop images: ')
  const ids: number[] = []
  for (const img of WS_IMAGES) ids.push(await upload(payload, img))
  console.log(` done (${ids.length} images)`)

  // ── Seed "In-Class Workshop Booking" form ─────────────────────────────────
  const existingForm = await payload.find({ collection: 'forms', where: { title: { equals: 'In-Class Workshop Booking' } }, limit: 1 })
  let formId: number | string

  if (existingForm.docs.length) {
    formId = existingForm.docs[0].id
    console.log(`Form exists (id ${formId})`)
  } else {
    const gradeOptions = ['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].map(g => ({ label: `Grade ${g}`, value: g }))
    const form = await payload.create({
      collection: 'forms',
      data: {
        title: 'In-Class Workshop Booking',
        formType: 'general',
        submitButtonText: 'Submit',
        successMessage: "Thank you! We'll confirm your workshop booking within 1–2 business days.",
        fields: [
          { name: 'date', label: 'Select Date', fieldType: 'date', required: true },
          {
            name: 'timeSlots',
            label: 'Select Time Slots (up to 3)',
            fieldType: 'checkboxGroup',
            required: false,
            maxSelections: 3,
            selectOptions: [
              { label: '9:00 – 10:15 AM', value: '9:00' },
              { label: '10:30 – 11:45 AM', value: '10:30' },
              { label: '12:20 – 2:00 PM', value: '12:20' },
            ],
          },
          { name: 'schoolName', label: 'School Name', fieldType: 'text', required: true, placeholder: 'e.g. Bear Creek Elementary' },
          { name: 'teacherName', label: 'Teacher Name', fieldType: 'text', required: true, placeholder: 'Your full name' },
          { name: 'teacherEmail', label: 'Teacher Email', fieldType: 'email', required: true, placeholder: 'teacher@school.ca' },
          { name: 'numberOfStudents', label: 'Number of Students', fieldType: 'text', required: true, placeholder: 'e.g. 28' },
          { name: 'grade', label: 'Grade', fieldType: 'select', required: true, selectOptions: gradeOptions },
          {
            name: 'canvasesRequired',
            label: 'Are Canvases Required?',
            fieldType: 'radio',
            required: true,
            selectOptions: [
              { label: 'Yes — add $3/student', value: 'yes' },
              { label: 'No — we will provide our own', value: 'no' },
            ],
          },
        ],
      } as any,
    })
    formId = form.id
    console.log(`Form created (id ${formId})`)
  }

  // ── Build page layout ─────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const layout: any[] = [
    // 1. Hero
    {
      blockType: 'hero',
      title: 'Transform Your Classroom With Our Painting Workshops!',
      subtitle: 'We bring the art studio to you — every student creates a beautiful 11×14 acrylic painting. $10 per student, all supplies included.',
      ctaLabel: 'Book Now',
      ctaLink: '#booking',
      backgroundImage: ids[0],
    },

    // 2. Horizontal slider — 5 workshop photos
    {
      blockType: 'horizontalSlider',
      slides: ids.slice(0, 5).map(id => ({ image: id })),
      speed: 24,
      imageHeight: 300,
    },

    // 3. Highlight callout — key facts
    {
      blockType: 'highlightCallout',
      backgroundColor: '#3B4BC8',
      text: '$10 per student · 1 hr 15 min per session · 11×14 canvas · 3 workshops per day · Canvases available at $3 each',
      ctaLabel: 'Book a Workshop',
      ctaLink: '#booking',
    },

    // 4. Accordion — What to Expect / What We Need
    {
      blockType: 'accordionBlock',
      title: 'Everything You Need to Know',
      items: [
        {
          heading: 'What to Expect',
          defaultOpen: true,
          content: 'We recreate the fun of an art studio right in your classroom. Each session lasts approximately 1 hour and 15 minutes — we guide your students step-by-step through creating a beautiful painting on an 11×14 canvas.\n\nWe typically conduct three workshops in a day, starting around 9 AM. We aim to finish two workshops before lunch and one after the lunch break.\n\nCanvases are available for purchase at $3 each, or your class can bring their own. We provide all the necessary paint, brushes, and supplies.',
        },
        {
          heading: 'What We Need from You',
          defaultOpen: false,
          content: 'To ensure a smooth painting experience, we kindly ask that you cover the tables to protect them from paint. We also need wax paper to hold the paint as we work.\n\nTables and chairs for all students should be set up before we arrive.',
        },
        {
          heading: 'Why Choose Our Workshops?',
          defaultOpen: false,
          content: 'Our painting workshops are designed to be both therapeutic and educational. Whether your students are learning about specific art techniques, exploring famous artists like Van Gogh and Monet, or celebrating a special occasion, our workshops are the perfect addition to your curriculum.\n\nOur after-school program operates within the Surrey, Burnaby, and Vancouver School Districts, and our insurance is on file with the District.',
        },
        {
          heading: 'Pricing & Booking',
          defaultOpen: false,
          content: 'The fee is just $10 per student — this includes all paint, brushes, and water cups. Canvases are an additional $3 each (optional — students may bring their own).\n\nPlease book at least one month in advance to reserve your date. Complete the booking form below and we will confirm your workshop within 1–2 business days.',
        },
      ],
    },

    // 5. Image grid — 9 workshop photos (3-column)
    {
      blockType: 'imageGrid',
      title: 'Workshop Gallery',
      columns: '3',
      images: ids.slice(1).map(id => ({ image: id })),
    },

    // 6. Form block — booking form
    {
      blockType: 'formBlock',
      heading: 'Book Your In-Class Workshop',
      subheading: 'Fill in the form below and we\'ll confirm your booking within 1–2 business days.',
      form: formId,
    },

    // 7. Footer CTA
    {
      blockType: 'footerCta',
      topTagline: 'Bring Art to Your Classroom',
      headline: 'Neighbourhood Art Studios is Waiting For You.',
      primaryCtaLabel: 'Start Taking Your Artist Talent To The Next Level',
      primaryCtaLink: '/contact',
    },
  ]

  const result = await payload.find({ collection: 'pages', where: { slug: { equals: 'in-class-workshops' } }, limit: 1 })
  const page = result.docs[0]
  if (!page) throw new Error('in-class-workshops page not found')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await payload.update({ collection: 'pages', id: page.id, data: { layout } as any })
  console.log(`in-class-workshops page (id ${page.id}) updated — ${layout.length} blocks`)
  process.exit(0)
}

main().catch(e => { console.error(e); process.exit(1) })
