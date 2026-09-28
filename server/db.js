import { mkdirSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { createClient } from '@libsql/client'

// Turso (hosted SQLite) in production; a local SQLite file for development.
// Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN to use Turso.
const TURSO_URL = (process.env.TURSO_DATABASE_URL ?? '').trim()
export const isLocal = !TURSO_URL

function localUrl() {
  if (process.env.DB_PATH) return pathToFileURL(process.env.DB_PATH).href
  mkdirSync(new URL('./data/', import.meta.url), { recursive: true })
  return new URL('./data/pujo.db', import.meta.url).href
}

export const db = createClient(
  isLocal ? { url: localUrl() } : { url: TURSO_URL, authToken: (process.env.TURSO_AUTH_TOKEN ?? '').trim() },
)
export const describeDatabase = () => (isLocal ? `local file (${localUrl()})` : `Turso (${TURSO_URL})`)

// Query helpers returning plain objects ({ column: value }).
const plain = ({ columns, rows }) => rows.map((row) => Object.fromEntries(columns.map((c, i) => [c, row[i]])))
const all = async (sql, args = []) => plain(await db.execute({ sql, args }))
const one = async (sql, args = []) => (await all(sql, args))[0]
const run = (sql, args = []) => db.execute({ sql, args })
const hasColumn = async (table, column) => Boolean(await one('SELECT 1 FROM pragma_table_info(?) WHERE name = ?', [table, column]))

// Creates the tables and upgrades databases made by earlier versions of Uma.
async function migrate() {
  if (isLocal) await db.execute('PRAGMA journal_mode = WAL')
  await db.executeMultiple(`
    -- Users sign in with Google. google_sub is Google's permanent ID for the account.
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      created_at INTEGER NOT NULL,
      last_login_at INTEGER,
      google_sub TEXT,
      avatar_url TEXT
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS chats (
      id INTEGER PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS chats_by_user ON chats(user_id, updated_at DESC);

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY,
      chat_id INTEGER NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
      role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
      text TEXT NOT NULL,
      image TEXT, -- no longer written; photos are not stored
      off_topic INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS messages_by_chat ON messages(chat_id, id);
  `)

  // Databases created before sign-in went password-free have a password_hash column; drop it.
  if (await hasColumn('users', 'password_hash')) {
    await run('ALTER TABLE users DROP COLUMN password_hash')
    await run('ALTER TABLE users ADD COLUMN last_login_at INTEGER')
  }
  // Photos are not stored: messages only remember that a photo was shared.
  if (!(await hasColumn('messages', 'had_photo'))) {
    await run('ALTER TABLE messages ADD COLUMN had_photo INTEGER NOT NULL DEFAULT 0')
    await run('UPDATE messages SET had_photo = 1, image = NULL WHERE image IS NOT NULL')
  }
  // Databases from the emailed-code sign-in era: add the Google columns, drop the codes table.
  if (!(await hasColumn('users', 'google_sub'))) {
    await run('ALTER TABLE users ADD COLUMN google_sub TEXT')
    await run('ALTER TABLE users ADD COLUMN avatar_url TEXT')
  }
  await run('CREATE UNIQUE INDEX IF NOT EXISTS users_by_google ON users(google_sub)')
  await run('DROP TABLE IF EXISTS login_codes')

  await run('DELETE FROM sessions WHERE expires_at < ?', [Date.now()])
}

try {
  await migrate()
} catch (err) {
  console.error(`
Could not open the database: ${describeDatabase()}`)
  console.error(isLocal ? err.message : `Check TURSO_DATABASE_URL and TURSO_AUTH_TOKEN. (${err.message})`)
  process.exit(1)
}

// Finds the user for this Google account, creating them on first sign-in, and refreshes their
// name, email and photo from Google. Accounts made before Google sign-in are matched by email.
export async function signInGoogleUser({ sub, name, email, picture }) {
  const now = Date.now()
  const existing =
    (await one('SELECT id FROM users WHERE google_sub = ?', [sub])) ?? (await one('SELECT id FROM users WHERE email = ?', [email]))
  if (existing) {
    await run('UPDATE users SET name = ?, email = ?, google_sub = ?, avatar_url = ?, last_login_at = ? WHERE id = ?', [
      name,
      email,
      sub,
      picture,
      now,
      existing.id,
    ])
    return { id: Number(existing.id), name, email, avatar_url: picture }
  }
  const { lastInsertRowid } = await run(
    'INSERT INTO users (name, email, google_sub, avatar_url, created_at, last_login_at) VALUES (?, ?, ?, ?, ?, ?)',
    [name, email, sub, picture, now, now],
  )
  return { id: Number(lastInsertRowid), name, email, avatar_url: picture }
}

export const findUserBySession = (tokenHash) =>
  one(
    `SELECT u.id, u.name, u.email, u.avatar_url FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = ? AND s.expires_at > ?`,
    [tokenHash, Date.now()],
  )
export const createSession = (tokenHash, userId, expiresAt) =>
  run('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)', [tokenHash, userId, expiresAt])
export const deleteSession = (tokenHash) => run('DELETE FROM sessions WHERE token_hash = ?', [tokenHash])

export const listChats = (userId) => all('SELECT id, title, updated_at FROM chats WHERE user_id = ? ORDER BY updated_at DESC', [userId])
export const getChat = (chatId, userId) => one('SELECT id, title, updated_at FROM chats WHERE id = ? AND user_id = ?', [chatId, userId])
export const renameChat = async (chatId, userId, title) =>
  (await run('UPDATE chats SET title = ? WHERE id = ? AND user_id = ?', [title, chatId, userId])).rowsAffected > 0

// Deletes the chat and its messages together (explicitly, so it doesn't rely on foreign-key settings).
export async function deleteChat(chatId, userId) {
  const [, deleted] = await db.batch(
    [
      { sql: 'DELETE FROM messages WHERE chat_id IN (SELECT id FROM chats WHERE id = ? AND user_id = ?)', args: [chatId, userId] },
      { sql: 'DELETE FROM chats WHERE id = ? AND user_id = ?', args: [chatId, userId] },
    ],
    'write',
  )
  return deleted.rowsAffected > 0
}

export const getMessages = async (chatId) =>
  (await all('SELECT id, role, text, had_photo, off_topic FROM messages WHERE chat_id = ? ORDER BY id', [chatId])).map((m) => ({
    id: Number(m.id),
    role: m.role,
    text: m.text,
    had_photo: Boolean(m.had_photo),
    off_topic: Boolean(m.off_topic),
  }))

// Stores a user message and the reply together, creating the chat first if needed.
export async function saveExchange({ userId, chatId, title, user, reply }) {
  const now = Date.now()
  const offTopic = reply.offTopic ? 1 : 0
  const tx = await db.transaction('write')
  try {
    let id = chatId
    if (!id) {
      const created = await tx.execute({
        sql: 'INSERT INTO chats (user_id, title, created_at, updated_at) VALUES (?, ?, ?, ?)',
        args: [userId, title, now, now],
      })
      id = Number(created.lastInsertRowid)
    }
    const insert = 'INSERT INTO messages (chat_id, role, text, had_photo, off_topic, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    const u = await tx.execute({ sql: insert, args: [id, 'user', user.text, user.hadPhoto ? 1 : 0, offTopic, now] })
    const a = await tx.execute({ sql: insert, args: [id, 'assistant', reply.text, 0, offTopic, now + 1] })
    await tx.execute({ sql: 'UPDATE chats SET updated_at = ? WHERE id = ?', args: [now, id] })
    await tx.commit()
    return { chatId: id, userMessageId: Number(u.lastInsertRowid), replyId: Number(a.lastInsertRowid) }
  } catch (err) {
    await tx.rollback().catch(() => {})
    throw err
  } finally {
    tx.close()
  }
}
