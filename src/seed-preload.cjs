/**
 * CJS preload: fix the @next/env ESM/CJS interop issue before Payload loads.
 *
 * @next/env is compiled with __esModule:true but exports no default.
 * esbuild's __toESM (used inside Payload's dist) sees __esModule:true and
 * trusts the .default property, which is undefined — crashing Payload's
 * loadEnv shim at module-init time.
 *
 * payload has its own nested copy of @next/env in
 * node_modules/payload/node_modules/@next/env — both copies need the patch.
 *
 * This file is loaded via `node --require` BEFORE tsx registers its loader
 * and BEFORE any ES-module graph is resolved, so the patched versions are
 * the ones every downstream require() receives from the module cache.
 */
const path = require('path')
const fs = require('fs')

// Load .env.local before any imports so DATABASE_URI / PAYLOAD_SECRET are
// available when payload.config.ts is first evaluated (static imports run
// before any code in the calling module body).
try {
  const envPath = path.resolve(__dirname, '../.env.local')
  const text = fs.readFileSync(envPath, 'utf-8')
  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    const val = trimmed.slice(eq + 1).trim()
    if (!(key in process.env)) process.env[key] = val
  }
} catch (_) { /* .env.local absent — rely on existing env */ }

function patchNextEnv(modPath) {
  try {
    const m = require(modPath)
    if (!m.default) m.default = m
  } catch (_) { /* absent */ }
}

// Top-level copy
patchNextEnv('@next/env')
// Payload's nested copy
patchNextEnv(path.resolve(__dirname, '../node_modules/payload/node_modules/@next/env'))
