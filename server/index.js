import { createServer } from 'node:http'
import { scheduleDailyBackups } from './backup.js'
import { currentUser, endSession, startSession, tooManyAttempts } from './auth.js'
import { db, deleteChat, getChat, getMessages, listChats, renameChat, saveExchange, signInGoogleUser } from './db.js'
import { GOOGLE_CLIENT_ID, GoogleAuthError, verifyGoogleIdToken } from './google.js'
import { askModel, describeProviders, hasApiKey, LlmError } from './llm.js'

const PORT = process.env.PORT || 3001
const MAX_BODY_BYTES = 15 * 1024 * 1024 // photos arrive as base64 data URLs
const MAX_TEXT = 2000
const MAX_IMAGE_CHARS = 6 * 1024 * 1024

class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks = []
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > MAX_BODY_BYTES) {
        reject(new HttpError(413, 'Request too large'))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => {
      try {
        resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {})
      } catch {
        reject(new HttpError(400, 'Invalid JSON'))
      }
    })
    req.on('error', reject)
  })
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers })
  res.end(JSON.stringify(body))
}

// The visitor's address. Behind a hosting proxy, set TRUST_PROXY=1 so the real address is used.
const clientIp = (req) =>
  (process.env.TRUST_PROXY === '1' && String(req.headers['x-forwarded-for'] ?? '').split(',')[0].trim()) ||
  req.socket.remoteAddress

function requireUser(req) {
  const user = currentUser(req)
  if (!user) throw new HttpError(401, 'Please log in')
  return user
}

const publicUser = ({ id, name, email, avatar_url }) => ({ id, name, email, avatar: avatar_url ?? null })
const chatTitle = (text) => {
  const t = text.replace(/\s+/g, ' ').trim()
  return t.length > 48 ? `${t.slice(0, 45)}…` : t || 'Photo chat'
}

// ---- Auth ----

// Settings the browser needs: the Google client ID for the sign-in button.
function config(req, res) {
  send(res, 200, { googleClientId: GOOGLE_CLIENT_ID || null })
}

// The browser sends the ID token from the "Sign in with Google" button; we verify it with Google's keys.
async function googleSignIn(req, res) {
  const { credential = '', remember = true } = await readJson(req)
  if (tooManyAttempts(`google:${clientIp(req)}`, 30)) throw new HttpError(429, 'Too many attempts. Try again in a few minutes.')
  let profile
  try {
    profile = await verifyGoogleIdToken(credential)
  } catch (err) {
    if (err instanceof GoogleAuthError) throw new HttpError(401, err.message)
    throw err
  }
  const user = signInGoogleUser(profile)
  send(res, 200, { user: publicUser(user) }, { 'Set-Cookie': startSession(user.id, remember !== false) })
}

function logout(req, res) {
  send(res, 200, { ok: true }, { 'Set-Cookie': endSession(req) })
}

function me(req, res) {
  send(res, 200, { user: publicUser(requireUser(req)) })
}

// ---- Chats ----

function chats(req, res) {
  const user = requireUser(req)
  send(res, 200, { chats: listChats(user.id) })
}

function chat(req, res, id) {
  const user = requireUser(req)
  const found = getChat(id, user.id)
  if (!found) throw new HttpError(404, 'Chat not found')
  send(res, 200, { chat: found, messages: getMessages(id) })
}

async function rename(req, res, id) {
  const user = requireUser(req)
  const { title = '' } = await readJson(req)
  const clean = String(title).trim().slice(0, 60)
  if (!clean) throw new HttpError(400, 'Title cannot be empty')
  if (!renameChat(id, user.id, clean)) throw new HttpError(404, 'Chat not found')
  send(res, 200, { ok: true })
}

function remove(req, res, id) {
  const user = requireUser(req)
  if (!deleteChat(id, user.id)) throw new HttpError(404, 'Chat not found')
  send(res, 200, { ok: true })
}

// Sends a message: the history comes from the database, never from the browser.
async function message(req, res) {
  const user = requireUser(req)
  const { chatId = null, text = '', image = null } = await readJson(req)

  const cleanText = String(text).trim().slice(0, MAX_TEXT)
  const cleanImage = typeof image === 'string' && image.startsWith('data:image/') && image.length <= MAX_IMAGE_CHARS ? image : null
  if (image && !cleanImage) throw new HttpError(400, 'That photo could not be used. Try a smaller JPG or PNG.')
  if (!cleanText && !cleanImage) throw new HttpError(400, 'Message is empty')
  const userText = cleanText || 'What outfit would go well with this?'

  let history = []
  if (chatId) {
    if (!getChat(Number(chatId), user.id)) throw new HttpError(404, 'Chat not found')
    history = getMessages(Number(chatId))
  }

  let reply
  try {
    reply = await askModel([...history, { role: 'user', text: userText, image: cleanImage }], user)
  } catch (err) {
    if (err instanceof LlmError) throw new HttpError(502, err.message)
    throw err
  }

  const saved = saveExchange({
    userId: user.id,
    chatId: chatId ? Number(chatId) : null,
    title: chatTitle(userText),
    user: { text: userText, hadPhoto: Boolean(cleanImage) },
    reply,
  })
  send(res, 200, {
    chat: getChat(saved.chatId, user.id),
    userMessage: { id: saved.userMessageId, role: 'user', text: userText, had_photo: Boolean(cleanImage), off_topic: reply.offTopic },
    reply: { id: saved.replyId, role: 'assistant', text: reply.text, had_photo: false, off_topic: reply.offTopic },
  })
}

// ---- Router ----

const routes = [
  ['GET', /^\/api\/config$/, config],
  ['POST', /^\/api\/auth\/google$/, googleSignIn],
  ['POST', /^\/api\/auth\/logout$/, logout],
  ['GET', /^\/api\/auth\/me$/, me],
  ['GET', /^\/api\/chats$/, chats],
  ['GET', /^\/api\/chats\/(\d+)$/, chat],
  ['PATCH', /^\/api\/chats\/(\d+)$/, rename],
  ['DELETE', /^\/api\/chats\/(\d+)$/, remove],
  ['POST', /^\/api\/messages$/, message],
]

createServer(async (req, res) => {
  try {
    const path = new URL(req.url, 'http://localhost').pathname
    // Browsers can't send JSON cross-site without a preflight, so requiring it blocks CSRF form posts.
    if (req.method !== 'GET' && req.method !== 'DELETE' && !String(req.headers['content-type']).startsWith('application/json')) {
      throw new HttpError(415, 'Expected JSON')
    }
    for (const [method, pattern, handler] of routes) {
      const match = req.method === method && path.match(pattern)
      if (match) return await handler(req, res, match[1] ? Number(match[1]) : undefined)
    }
    throw new HttpError(404, 'Not found')
  } catch (err) {
    if (err instanceof HttpError) return send(res, err.status, { error: err.message })
    console.error(err)
    send(res, 500, { error: 'Something went wrong on the server' })
  }
}).listen(PORT, () => {
  console.log(`Uma API on http://localhost:${PORT}`)
  console.log(`AI providers: ${describeProviders()}`)
  if (!hasApiKey) console.warn('Warning: no GROQ_API_KEY or GEMINI_API_KEY is set, so chat replies will fail. Add one to .env.')
  scheduleDailyBackups(db)
  if (!GOOGLE_CLIENT_ID) console.warn('Warning: GOOGLE_CLIENT_ID is not set, so nobody can sign in. See the README.')
})
