import { createHash, randomBytes } from 'node:crypto'
import { createSession, deleteSession, findUserBySession } from './db.js'

const COOKIE = 'pujo_sid'
const SECURE = process.env.COOKIE_SECURE === '1' ? '; Secure' : ''
const REMEMBER_DAYS = 30 // "Stay signed in"
const SHORT_SESSION_HOURS = 12 // otherwise: until the browser closes, at most this long

const sha256 = (value) => createHash('sha256').update(value).digest('hex')

// ---- Sessions ----

function readCookie(req, name) {
  const header = req.headers.cookie || ''
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=')
    if (k === name) return decodeURIComponent(v.join('='))
  }
  return null
}

// Creates a session and returns the Set-Cookie header value. Only a hash of the token is stored.
// With `remember`, the cookie lasts 30 days; without it, it is a browser-session cookie.
export function startSession(userId, remember) {
  const token = randomBytes(32).toString('base64url')
  const lifetime = remember ? REMEMBER_DAYS * 24 * 60 * 60 : SHORT_SESSION_HOURS * 60 * 60
  createSession(sha256(token), userId, Date.now() + lifetime * 1000)
  const maxAge = remember ? `; Max-Age=${lifetime}` : ''
  return `${COOKIE}=${token}; HttpOnly; SameSite=Lax; Path=/${maxAge}${SECURE}`
}

export function endSession(req) {
  const token = readCookie(req, COOKIE)
  if (token) deleteSession(sha256(token))
  return `${COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${SECURE}`
}

export function currentUser(req) {
  const token = readCookie(req, COOKIE)
  return token ? findUserBySession(sha256(token)) ?? null : null
}

// ---- Rate limiting ----

const attempts = new Map()

// Returns true once `key` has been used more than `max` times within `windowMs`.
export function tooManyAttempts(key, max = 10, windowMs = 15 * 60 * 1000) {
  const now = Date.now()
  const entry = attempts.get(key)
  if (!entry || now - entry.start > windowMs) {
    attempts.set(key, { start: now, count: 1 })
    return false
  }
  entry.count += 1
  return entry.count > max
}
