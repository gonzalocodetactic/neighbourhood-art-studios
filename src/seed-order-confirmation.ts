import { getPayload } from 'payload'
import config from '../payload.config'

async function main() {
  const payload = await getPayload({ config })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const layout: any[] = [
    {
      blockType: 'orderSummary',
      heading: 'Thank you for your registration!',
      subheading: 'Here are your registration details and receipt summary.',
      supportText: [
        'You will receive a confirmation email shortly at the address provided.',
        'If you have any questions about your registration, please contact us at info@neighbourhoodartstudios.com.',
        'We look forward to seeing your child in class!',
      ].join('\n\n'),
      showPrintButton: true,
      homeButtonText: 'Return to Home',
    },
  ]

  const result = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'order-confirmation' } },
    limit: 1,
  })

  if (result.docs.length > 0) {
    await payload.update({ collection: 'pages', id: result.docs[0].id, data: { layout } as any })
    console.log(`Order Confirmation page updated (id ${result.docs[0].id})`)
  } else {
    const page = await payload.create({
      collection: 'pages',
      data: { title: 'Order Confirmation', slug: 'order-confirmation', layout } as any,
    })
    console.log(`Order Confirmation page created (id ${page.id})`)
  }

  process.exit(0)
}

main().catch(e => { console.error(e); process.exit(1) })
