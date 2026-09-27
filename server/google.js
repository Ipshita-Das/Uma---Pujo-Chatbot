import { createPublicKey, createVerify } from 'node:crypto'

// Verifies the ID token that Google's "Sign in with Google" button gives the browser.
// See https://developers.google.com/identity/gsi/web/guides/verify-google-id-token

export const GOOGLE_CLIENT_ID = (process.env.GOOGLE_CLIENT_ID ?? '').trim()
const CERTS_URL = process.env.GOOGLE_CERTS_URL || 'https://www.googleapis.com/oauth2/v3/certs'
const ISSUERS = new Set(['accounts.google.com', 'https://accounts.google.com'])
const CLOCK_SKEW_S = 60

export class GoogleAuthError extends Error {}

// Google's signing keys rotate; cache them for as long as Google says (Cache-Control max-age).
let keyCache = { keys: new Map(), expires: 0 }

async function signingKey(kid) {
  if (Date.now() > keyCache.expires || !keyCache.keys.has(kid)) {
    const res = await fetch(CERTS_URL, { signal: AbortSignal.timeout(10_000) })
    if (!res.ok) throw new Error(`Could not fetch Google keys (${res.status})`)
    const { keys } = await res.json()
    const maxAge = Number(/max-age=(\d+)/.exec(res.headers.get('cache-control') ?? '')?.[1] ?? 3600)
    keyCache = { keys: new Map(keys.map((k) => [k.kid, createPublicKey({ key: k, format: 'jwk' })])), expires: Date.now() + maxAge * 1000 }
  }
  return keyCache.keys.get(kid)
}

const decode = (part) => JSON.parse(Buffer.from(part, 'base64url').toString('utf8'))

// Returns { sub, email, name, picture } for a valid token, or throws GoogleAuthError.
export async function verifyGoogleIdToken(token) {
  if (!GOOGLE_CLIENT_ID) throw new GoogleAuthError('Google sign-in is not set up on the server yet.')

  const parts = String(token).split('.')
  if (parts.length !== 3) throw new GoogleAuthError('Invalid Google sign-in. Please try again.')
  let header, payload
  try {
    header = decode(parts[0])
    payload = decode(parts[1])
  } catch {
    throw new GoogleAuthError('Invalid Google sign-in. Please try again.')
  }

  const key = header.alg === 'RS256' ? await signingKey(header.kid) : null
  const valid =
    key && createVerify('RSA-SHA256').update(`${parts[0]}.${parts[1]}`).verify(key, Buffer.from(parts[2], 'base64url'))
  const now = Date.now() / 1000
  if (
    !valid ||
    !ISSUERS.has(payload.iss) ||
    payload.aud !== GOOGLE_CLIENT_ID ||
    !(payload.exp > now - CLOCK_SKEW_S) ||
    !(payload.iat < now + CLOCK_SKEW_S)
  ) {
    throw new GoogleAuthError('Google sign-in could not be verified. Please try again.')
  }
  if (!payload.email || payload.email_verified !== true) {
    throw new GoogleAuthError('Your Google account email is not verified.')
  }

  const email = String(payload.email).toLowerCase()
  return {
    sub: String(payload.sub),
    email,
    name: String(payload.name || payload.given_name || email.split('@')[0]).trim().slice(0, 60),
    picture: typeof payload.picture === 'string' && payload.picture.startsWith('https://') ? payload.picture : null,
  }
}
