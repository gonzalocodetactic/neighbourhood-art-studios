import configPromise from '@payload-config'
import { getPayload } from 'payload'

async function main() {
  const payload = await getPayload({ config: configPromise })

  console.log('Seeding camp data…')

  // Locations
  const loc1 = await payload.create({ collection: 'locations', data: { name: 'Surrey Arts Centre', address: '13750 88 Ave', city: 'Surrey' } as any })
  const loc2 = await payload.create({ collection: 'locations', data: { name: 'White Rock Community Centre', address: '15154 Russell Ave', city: 'White Rock' } as any })
  const loc3 = await payload.create({ collection: 'locations', data: { name: 'Cloverdale Community Centre', address: '17655 57 Ave', city: 'Surrey' } as any })
  console.log('Created locations:', loc1.id, loc2.id, loc3.id)

  // Timeslots
  const ts1 = await payload.create({ collection: 'timeslots', data: { label: '9:00 AM – 3:00 PM', startTime: '09:00', endTime: '15:00' } as any })
  const ts2 = await payload.create({ collection: 'timeslots', data: { label: '9:00 AM – 12:00 PM', startTime: '09:00', endTime: '12:00' } as any })
  console.log('Created timeslots:', ts1.id, ts2.id)

  // Camp weeks
  const w1 = await payload.create({ collection: 'camp-weeks', data: { label: 'Week 1 (Jul 7–11)', startDate: '2025-07-07T07:00:00.000Z', endDate: '2025-07-11T07:00:00.000Z' } as any })
  const w2 = await payload.create({ collection: 'camp-weeks', data: { label: 'Week 2 (Jul 14–18)', startDate: '2025-07-14T07:00:00.000Z', endDate: '2025-07-18T07:00:00.000Z' } as any })
  const w3 = await payload.create({ collection: 'camp-weeks', data: { label: 'Week 3 (Jul 21–25)', startDate: '2025-07-21T07:00:00.000Z', endDate: '2025-07-25T07:00:00.000Z' } as any })
  console.log('Created camp weeks:', w1.id, w2.id, w3.id)

  // Camp product
  const product = await payload.create({
    collection: 'products',
    data: {
      title: 'Summer Art Camp 2025',
      productType: 'camp',
    } as any,
  })
  console.log('Created camp product:', product.id)

  // Camp sessions
  const s1 = await payload.create({
    collection: 'camp-sessions',
    data: {
      product: product.id,
      location: loc1.id,
      timeslot: ts1.id,
      campWeek: w1.id,
      price: 225,
      capacity: 20,
      registeredCount: 0,
      status: 'open',
    } as any,
  })
  const s2 = await payload.create({
    collection: 'camp-sessions',
    data: {
      product: product.id,
      location: loc2.id,
      timeslot: ts2.id,
      campWeek: w2.id,
      price: 150,
      capacity: 15,
      registeredCount: 0,
      status: 'open',
    } as any,
  })
  console.log('Created camp sessions:', s1.id, s2.id)
  console.log('Done!')
  process.exit(0)
}

main().catch((err) => { console.error(err); process.exit(1) })
