import { mkdirSync, readdirSync, rmSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { backup, DatabaseSync } from 'node:sqlite'
import { fileURLToPath } from 'node:url'

export const BACKUP_DIR = process.env.BACKUP_DIR || fileURLToPath(new URL('./backups/', import.meta.url))
const KEEP = Number(process.env.BACKUP_KEEP) || 14
const DAY_MS = 24 * 60 * 60 * 1000
const PREFIX = 'pujo-'

// Local time, e.g. pujo-2026-09-27-23-01-46.db
const stamp = () => {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}-${p(d.getHours())}-${p(d.getMinutes())}-${p(d.getSeconds())}`
}

function listBackups() {
  mkdirSync(BACKUP_DIR, { recursive: true })
  return readdirSync(BACKUP_DIR)
    .filter((f) => f.startsWith(PREFIX) && f.endsWith('.db'))
    .map((f) => ({ file: join(BACKUP_DIR, f), time: statSync(join(BACKUP_DIR, f)).mtimeMs }))
    .sort((a, b) => b.time - a.time)
}

// Copies the live database into a new timestamped file, then deletes the oldest backups
// beyond BACKUP_KEEP. Uses SQLite's online backup, so it is safe while the server is running.
export async function backupDatabase(db) {
  mkdirSync(BACKUP_DIR, { recursive: true })
  const file = join(BACKUP_DIR, `${PREFIX}${stamp()}.db`)
  await backup(db, file)
  // Make the copy a single self-contained file (no -wal/-shm companions), easy to move or open.
  const copy = new DatabaseSync(file)
  copy.exec('PRAGMA journal_mode = DELETE')
  copy.close()
  for (const old of listBackups().slice(KEEP)) rmSync(old.file)
  return file
}

// Backs up now if the newest backup is more than a day old, then once every day.
export function scheduleDailyBackups(db) {
  const run = () =>
    backupDatabase(db)
      .then((file) => console.log(`Database backed up to ${file}`))
      .catch((err) => console.error('Database backup failed:', err))

  const newest = listBackups()[0]
  if (!newest || Date.now() - newest.time > DAY_MS) run()
  setInterval(run, DAY_MS).unref()
}
