/**
 * Removes registrations and parent accounts created by automated test runs
 * (scripts/e2e-*.ts, test-registration.ts): anything on a reserved test email
 * domain, or a "John/Jane Doe" parent on an example.* domain. Legacy imports
 * (legacyWooOrderId set) are never touched.
 *
 *   env $(grep -v '^#' .env.staging | xargs) npx tsx scripts/clean-test-data.ts [--dry-run]
 */
import type { Where } from 'payload'

const TEST_EMAIL_DOMAINS = ['test.example.com', 'example.test', 'test.invalid']

async function loadPayload() {
  // Same @next/env interop patch the seed scripts use via `node --require`
  await import('../src/seed-preload.cjs')
  const { getPayload } = await import('payload')
  const { default: config } = await import('../payload.config')
  return getPayload({ config })
}

const testEmail: Where = {
  or: [
    ...TEST_EMAIL_DOMAINS.map((d) => ({ parentEmail: { like: `%@${d}` } })),
    {
      and: [
        { parentFirstName: { in: ['John', 'Jane'] } },
        { parentLastName: { equals: 'Doe' } },
        { parentEmail: { like: '%@%example.%' } },
      ],
    },
  ],
}

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  const payload = await loadPayload()

  const regs = await payload.find({
    collection: 'registrations',
    where: { and: [testEmail, { legacyWooOrderId: { exists: false } }] },
    limit: 5000,
    depth: 0,
    pagination: false,
  })

  for (const r of regs.docs) {
    console.log(`${dryRun ? 'would delete' : 'deleting'} registration ${r.id}  ${r.parentFirstName} ${r.parentLastName} <${r.parentEmail}>`)
    if (!dryRun) await payload.delete({ collection: 'registrations', id: r.id })
  }

  const parents = await payload.find({
    collection: 'parents',
    where: { or: TEST_EMAIL_DOMAINS.map((d) => ({ email: { like: `%@${d}` } })) },
    limit: 5000,
    depth: 0,
    pagination: false,
  })

  let parentCount = 0
  for (const p of parents.docs) {
    // Keep any parent that still has real registrations attached
    const remaining = await payload.count({ collection: 'registrations', where: { parent: { equals: p.id } } })
    const leftover = dryRun ? remaining.totalDocs - regs.docs.filter((r) => r.parent === p.id).length : remaining.totalDocs
    if (leftover > 0) {
      console.log(`keeping parent ${p.id} <${p.email}> — ${leftover} other registration(s)`)
      continue
    }
    console.log(`${dryRun ? 'would delete' : 'deleting'} parent ${p.id} <${p.email}>`)
    if (!dryRun) await payload.delete({ collection: 'parents', id: p.id })
    parentCount++
  }

  console.log(`\n${dryRun ? 'Dry run — would delete' : 'Deleted'} ${regs.docs.length} registration(s), ${parentCount} parent(s)`)
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
