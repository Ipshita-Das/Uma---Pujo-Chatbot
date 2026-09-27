// `npm run copy-to-turso`: copies users, chats and messages from the local database
// (server/data/pujo.db) into the Turso database set in .env. Run it once, before going live.
import { createClient } from '@libsql/client'

const TABLES = ['users', 'chats', 'messages'] // sessions are left out; people just sign in again

if (!process.env.TURSO_DATABASE_URL) {
  console.error('Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in .env first.')
  process.exit(1)
}

const local = createClient({ url: new URL('./data/pujo.db', import.meta.url).href })
const { db: turso } = await import('./db.js') // creates the tables in Turso

for (const table of TABLES) {
  const existing = (await turso.execute(`SELECT count(*) AS n FROM ${table}`)).rows[0][0]
  if (Number(existing) > 0) {
    console.error(`Turso already has data in "${table}" (${existing} rows). Stopping so nothing is duplicated.`)
    process.exit(1)
  }
}

for (const table of TABLES) {
  const { columns, rows } = await local.execute(`SELECT * FROM ${table}`)
  const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`
  const statements = rows.map((row) => ({ sql, args: columns.map((_, i) => row[i]) }))
  for (let i = 0; i < statements.length; i += 200) await turso.batch(statements.slice(i, i + 200), 'write')
  console.log(`${table}: copied ${rows.length} rows`)
}
console.log('Done. Your data is now in Turso.')
