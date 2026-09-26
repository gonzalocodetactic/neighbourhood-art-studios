/**
 * Sets an admin user's role. Use it once per environment after deploying RBAC —
 * existing accounts default to site-admin.
 *
 *   env $(grep -v '^#' .env.staging | xargs) npx tsx scripts/set-user-role.ts <email> <super-admin|site-admin>
 */
const ROLES = ['super-admin', 'site-admin'] as const

async function main() {
  const [email, role] = process.argv.slice(2)
  if (!email || !ROLES.includes(role as (typeof ROLES)[number])) {
    console.error(`Usage: set-user-role.ts <email> <${ROLES.join('|')}>`)
    process.exit(1)
  }

  await import('../src/seed-preload.cjs')
  const { getPayload } = await import('payload')
  const { default: config } = await import('../payload.config')
  const payload = await getPayload({ config })

  const { docs } = await payload.find({ collection: 'users', where: { email: { equals: email } }, limit: 1 })
  if (!docs[0]) {
    console.error(`No user with email ${email}`)
    process.exit(1)
  }

  // payload-types.ts may predate the role field, so don't rely on the generated User type
  const data = { role } as Record<string, unknown>
  await payload.update({ collection: 'users', id: docs[0].id, data })
  console.log(`${email} → ${role}`)
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
