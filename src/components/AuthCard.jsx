import { useEffect, useRef, useState } from 'react'
import { api } from '../api.js'
import { VineStrip } from './Folk.jsx'
import './AuthCard.css'

const REMEMBER_KEY = 'uma:remember'
const GIS_SRC = 'https://accounts.google.com/gsi/client'

// The "Stay signed in" choice from last time on this device. Browser storage can be unavailable.
function loadRemember() {
  try {
    return localStorage.getItem(REMEMBER_KEY) !== 'false'
  } catch {
    return true
  }
}
function saveRemember(value) {
  try {
    localStorage.setItem(REMEMBER_KEY, String(value))
  } catch {
    // Only a convenience.
  }
}

// Loads Google's sign-in library once.
let gisPromise
function loadGoogleScript() {
  gisPromise ??= new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = GIS_SRC
    script.async = true
    script.onload = () => resolve(window.google)
    script.onerror = () => {
      gisPromise = undefined
      reject(new Error('Could not load Google sign-in. Check your connection and try again.'))
    }
    document.head.appendChild(script)
  })
  return gisPromise
}

// Sign in with Google: one button, plus the "Stay signed in" choice.
export function AuthCard({ onAuthed }) {
  const [remember, setRemember] = useState(loadRemember)
  const [status, setStatus] = useState('loading') // loading | ready | unconfigured | busy
  const [error, setError] = useState('')
  const buttonRef = useRef(null)
  const rememberRef = useRef(remember)
  const onAuthedRef = useRef(onAuthed)

  useEffect(() => {
    rememberRef.current = remember
    onAuthedRef.current = onAuthed
  })

  useEffect(() => {
    let cancelled = false

    async function signIn({ credential }) {
      setStatus('busy')
      setError('')
      try {
        const { user } = await api('/api/auth/google', { method: 'POST', body: { credential, remember: rememberRef.current } })
        onAuthedRef.current(user)
      } catch (err) {
        setError(err.message)
        setStatus('ready')
      }
    }

    async function setUp() {
      try {
        const { googleClientId } = await api('/api/config')
        if (cancelled) return
        if (!googleClientId) {
          setStatus('unconfigured')
          return
        }
        const google = await loadGoogleScript()
        if (cancelled || !buttonRef.current) return
        google.accounts.id.initialize({ client_id: googleClientId, callback: signIn, ux_mode: 'popup', context: 'signin' })
        google.accounts.id.renderButton(buttonRef.current, {
          theme: 'outline',
          size: 'large',
          shape: 'pill',
          text: 'continue_with',
          logo_alignment: 'left',
          width: Math.min(300, buttonRef.current.parentElement.offsetWidth || 300),
        })
        setStatus('ready')
      } catch (err) {
        if (!cancelled) {
          setError(err.message)
          setStatus('ready')
        }
      }
    }

    setUp()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="auth-overlay">
      <div className="auth-card">
        <VineStrip className="auth-vine" />
        <div className="auth-body">
          <img className="auth-logo" src="/uma-wordmark.webp" alt="Uma" width="640" height="387" />
          <h2>Sign in to Uma</h2>
          <p className="auth-sub">Sign in with Google to chat. Your Pujo chats are saved, so Uma remembers you next time.</p>

          <div className="auth-google">
            <div ref={buttonRef} className="auth-google-button" hidden={status !== 'ready'} />
            {status === 'loading' && <p className="auth-wait">Loading Google sign-in…</p>}
            {status === 'busy' && <p className="auth-wait">Signing you in…</p>}
            {status === 'unconfigured' && (
              <p className="auth-error">Google sign-in isn't set up yet. Add GOOGLE_CLIENT_ID to the server's .env (see the README).</p>
            )}
          </div>

          <label className="auth-check">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => {
                setRemember(e.target.checked)
                saveRemember(e.target.checked)
              }}
            />
            <span>
              Stay signed in
              <small>Keep me signed in on this device for 30 days</small>
            </span>
          </label>

          {error && <p className="auth-error">{error}</p>}
          <p className="auth-legal">
            By continuing you agree to Uma's <a href="/terms.html">terms of service</a> and <a href="/privacy.html">privacy policy</a>.
          </p>
        </div>
      </div>
    </div>
  )
}
