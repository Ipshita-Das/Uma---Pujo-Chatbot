import { mkdirSync } from 'node:fs'
import { DatabaseSync } from 'node:sqlite'
import { fileURLToPath } from 'node:url'

const DB_PATH = process.env.DB_PATH || fileURLToPath(new URL('./data/pujo.db', import.meta.url))
if (!process.env.DB_PATH) mkdirSync(new URL('./data/', import.meta.url), { recursive: true })

export const db = new DatabaseSync(DB_PATH)

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

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
if (db.prepare('SELECT 1 FROM pragma_table_info(?) WHERE name = ?').get('users', 'password_hash')) {
  db.exec('ALTER TABLE users DROP COLUMN password_hash')
  db.exec('ALTER TABLE users ADD COLUMN last_login_at INTEGER')
}

// Photos are not stored: messages only remember that a photo was shared.
if (!db.prepare('SELECT 1 FROM pragma_table_info(?) WHERE name = ?').get('messages', 'had_photo')) {
  db.exec('ALTER TABLE messages ADD COLUMN had_photo INTEGER NOT NULL DEFAULT 0')
  db.exec('UPDATE messages SET had_photo = 1, image = NULL WHERE image IS NOT NULL')
}

// Databases from the emailed-code sign-in era: add the Google columns, drop the codes table.
if (!db.prepare('SELECT 1 FROM pragma_table_info(?) WHERE name = ?').get('users', 'google_sub')) {
  db.exec('ALTER TABLE users ADD COLUMN google_sub TEXT')
  db.exec('ALTER TABLE users ADD COLUMN avatar_url TEXT')
}
db.exec('CREATE UNIQUE INDEX IF NOT EXISTS users_by_google ON users(google_sub)')
db.exec('DROP TABLE IF EXISTS login_codes')

db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(Date.now())

const q = {
  insertUser: db.prepare(
    'INSERT INTO users (name, email, google_sub, avatar_url, created_at, last_login_at) VALUES (?, ?, ?, ?, ?, ?)',
  ),
  userByGoogle: db.prepare('SELECT id FROM users WHERE google_sub = ?'),
  userByEmail: db.prepare('SELECT id FROM users WHERE email = ?'),
  updateUserLogin: db.prepare(
    'UPDATE users SET name = ?, email = ?, google_sub = ?, avatar_url = ?, last_login_at = ? WHERE id = ?',
  ),
  userBySession: db.prepare(`
    SELECT u.id, u.name, u.email, u.avatar_url FROM sessions s JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ? AND s.expires_at > ?`),
  insertSession: db.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)'),
  deleteSession: db.prepare('DELETE FROM sessions WHERE token_hash = ?'),

  chatsForUser: db.prepare('SELECT id, title, updated_at FROM chats WHERE user_id = ? ORDER BY updated_at DESC'),
  chatForUser: db.prepare('SELECT id, title, updated_at FROM chats WHERE id = ? AND user_id = ?'),
  insertChat: db.prepare('INSERT INTO chats (user_id, title, created_at, updated_at) VALUES (?, ?, ?, ?)'),
  touchChat: db.prepare('UPDATE chats SET updated_at = ? WHERE id = ?'),
  renameChat: db.prepare('UPDATE chats SET title = ? WHERE id = ? AND user_id = ?'),
  deleteChat: db.prepare('DELETE FROM chats WHERE id = ? AND user_id = ?'),

  messagesForChat: db.prepare('SELECT id, role, text, had_photo, off_topic FROM messages WHERE chat_id = ? ORDER BY id'),
  insertMessage: db.prepare('INSERT INTO messages (chat_id, role, text, had_photo, off_topic, created_at) VALUES (?, ?, ?, ?, ?, ?)'),
}

// Finds the user for this Google account, creating them on first sign-in, and refreshes their
// name, email and photo from Google. Accounts made before Google sign-in are matched by email.
export function signInGoogleUser({ sub, name, email, picture }) {
  const now = Date.now()
  const existing = q.userByGoogle.get(sub) ?? q.userByEmail.get(email)
  if (existing) {
    q.updateUserLogin.run(name, email, sub, picture, now, existing.id)
    return { id: existing.id, name, email, avatar_url: picture }
  }
  const { lastInsertRowid } = q.insertUser.run(name, email, sub, picture, now, now)
  return { id: Number(lastInsertRowid), name, email, avatar_url: picture }
}

export const findUserBySession = (tokenHash) => q.userBySession.get(tokenHash, Date.now())
export const createSession = (tokenHash, userId, expiresAt) => q.insertSession.run(tokenHash, userId, expiresAt)
export const deleteSession = (tokenHash) => q.deleteSession.run(tokenHash)

export const listChats = (userId) => q.chatsForUser.all(userId)
export const getChat = (chatId, userId) => q.chatForUser.get(chatId, userId)
export const renameChat = (chatId, userId, title) => q.renameChat.run(title, chatId, userId).changes > 0
export const deleteChat = (chatId, userId) => q.deleteChat.run(chatId, userId).changes > 0
export const getMessages = (chatId) =>
  q.messagesForChat.all(chatId).map((m) => ({ ...m, had_photo: Boolean(m.had_photo), off_topic: Boolean(m.off_topic) }))

// Stores a user message and the reply together, creating the chat first if needed.
export function saveExchange({ userId, chatId, title, user, reply }) {
  const now = Date.now()
  db.exec('BEGIN')
  try {
    let id = chatId
    if (!id) id = Number(q.insertChat.run(userId, title, now, now).lastInsertRowid)
    const offTopic = reply.offTopic ? 1 : 0
    const u = q.insertMessage.run(id, 'user', user.text, user.hadPhoto ? 1 : 0, offTopic, now)
    const a = q.insertMessage.run(id, 'assistant', reply.text, 0, offTopic, now + 1)
    q.touchChat.run(now, id)
    db.exec('COMMIT')
    return { chatId: id, userMessageId: Number(u.lastInsertRowid), replyId: Number(a.lastInsertRowid) }
  } catch (err) {
    db.exec('ROLLBACK')
    throw err
  }
}
