import { useEffect, useRef, useState } from 'react'
import { Painting } from './Painting.jsx'
import { VineStrip } from './Folk.jsx'
import { CREAM, INK, RED, TEAL, YELLOW } from './palette.js'
import './CardMaker.css'

const W = 1080
const H = 1350
const MAX_MESSAGE = 220
const PAPER = '#f8e9cc'
const SERIF = '"Tiro Bangla", Georgia, serif'
const SANS = 'system-ui, "Segoe UI", Roboto, sans-serif'

const SUGGESTED_MESSAGES = [
  "May Maa Durga fill your home with joy, good health and happiness this Pujo. Let's meet for adda soon!",
  'Wishing you dhak-er beats, dhunuchi naach, endless bhog and the best Pujo ever.',
  "Maa's blessings be with you always. Shubho Sharodiya to you and your family!",
  'Here is to pandal hopping, new clothes and old friends. Have a wonderful Pujo!',
]
const DEFAULT_MESSAGE = SUGGESTED_MESSAGES[0]

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Could not load ${src}`))
    img.src = src
  })

// Turns the on-page Maa Durga painting (an <svg>) into an image that canvas can draw.
async function svgToImage(svg) {
  const clone = svg.cloneNode(true)
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  clone.setAttribute('width', '600')
  clone.setAttribute('height', '600')
  const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(clone)], { type: 'image/svg+xml' }))
  try {
    return await loadImage(url)
  } finally {
    URL.revokeObjectURL(url)
  }
}

// Splits text into lines that fit `maxWidth` with the context's current font.
function wrap(ctx, text, maxWidth) {
  const lines = []
  let line = ''
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const next = line ? `${line} ${word}` : word
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line)
      line = word
    } else {
      line = next
    }
  }
  if (line) lines.push(line)
  return lines
}

function outlinedText(ctx, text, x, y, { fill, stroke = INK, strokeWidth = 4, shadow }) {
  ctx.lineJoin = 'round'
  if (shadow) {
    ctx.fillStyle = shadow
    ctx.fillText(text, x + 6, y + 6)
  }
  ctx.strokeStyle = stroke
  ctx.lineWidth = strokeWidth
  ctx.strokeText(text, x, y)
  ctx.fillStyle = fill
  ctx.fillText(text, x, y)
}

// Draws the whole card and returns it as a PNG blob.
async function drawCard({ painting, wordmark, to, message, from }) {
  await Promise.all([document.fonts.load(`110px ${SERIF}`, 'শুভ শারদীয়া'), document.fonts.load(`60px ${SERIF}`, 'Dear')])
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'

  // Paper and a teal painted frame with white dots
  ctx.fillStyle = PAPER
  ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = TEAL
  ctx.fillRect(0, 0, W, 40)
  ctx.fillRect(0, H - 40, W, 40)
  ctx.fillRect(0, 0, 40, H)
  ctx.fillRect(W - 40, 0, 40, H)
  ctx.fillStyle = CREAM
  for (let x = 30; x < W; x += 30) {
    for (const y of [20, H - 20]) {
      ctx.beginPath()
      ctx.arc(x, y, 4, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  for (let y = 60; y < H - 40; y += 30) {
    for (const x of [20, W - 20]) {
      ctx.beginPath()
      ctx.arc(x, y, 4, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  ctx.strokeStyle = INK
  ctx.lineWidth = 5
  ctx.strokeRect(40, 40, W - 80, H - 80)
  ctx.strokeStyle = RED
  ctx.lineWidth = 3
  ctx.strokeRect(54, 54, W - 108, H - 108)

  // Greeting
  ctx.font = `104px ${SERIF}`
  outlinedText(ctx, 'শুভ শারদীয়া', W / 2, 188, { fill: RED, shadow: YELLOW, strokeWidth: 5 })

  // Maa Durga painting with a flat ink shadow
  const px = (W - 560) / 2
  const py = 232
  ctx.fillStyle = INK
  ctx.fillRect(px + 12, py + 12, 560, 560)
  ctx.drawImage(painting, px, py, 560, 560)

  // Dear …,
  ctx.font = `64px ${SERIF}`
  ctx.fillStyle = INK
  const dear = `Dear ${to},`
  ctx.fillText(dear.length > 32 ? `${dear.slice(0, 30)}…,` : dear, W / 2, 890)

  // Message
  // Long messages get a slightly smaller font so the whole message fits in the space.
  ctx.fillStyle = '#3d2a20'
  let size = 36
  let lines
  for (; size >= 26; size -= 2) {
    ctx.font = `${size}px ${SANS}`
    lines = wrap(ctx, message, W - 220)
    if ((lines.length - 1) * size * 1.33 <= 150) break
  }
  const lineGap = Math.round(size * 1.33)
  lines.forEach((l, i) => ctx.fillText(l, W / 2, 950 + i * lineGap))

  // From
  if (from) {
    ctx.font = `italic 44px ${SERIF}`
    ctx.fillStyle = RED
    ctx.fillText(`With love, ${from}`, W / 2, 950 + (lines.length - 1) * lineGap + 66)
  }

  // Footer: the Uma logo
  const logoW = 130
  const logoH = (wordmark.height / wordmark.width) * logoW
  ctx.drawImage(wordmark, W / 2 - logoW / 2, H - 66 - logoH, logoW, logoH)

  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
}

// Dialog for making a Sharodiya greeting card: recipient, optional message, sender.
export function CardMaker({ open, onClose, fromName = '' }) {
  const [to, setTo] = useState('')
  const [message, setMessage] = useState('')
  const [from, setFrom] = useState(fromName)
  const [preview, setPreview] = useState(null) // { url, blob }
  const [error, setError] = useState('')
  const paintingRef = useRef(null)
  const wordmarkRef = useRef(null)
  const canShareFiles = typeof navigator !== 'undefined' && typeof navigator.canShare === 'function'

  // Redraw the card (after a short pause in typing) whenever the details change.
  useEffect(() => {
    if (!open || !to.trim()) return
    let cancelled = false
    const timer = setTimeout(async () => {
      try {
        const svg = paintingRef.current?.querySelector('svg')
        if (!svg) return
        wordmarkRef.current ??= await loadImage('/uma-wordmark.webp')
        const blob = await drawCard({
          painting: await svgToImage(svg),
          wordmark: wordmarkRef.current,
          to: to.trim(),
          message: message.trim() || DEFAULT_MESSAGE,
          from: from.trim(),
        })
        if (cancelled || !blob) return
        setPreview((old) => {
          if (old) URL.revokeObjectURL(old.url)
          return { url: URL.createObjectURL(blob), blob }
        })
        setError('')
      } catch (err) {
        if (!cancelled) setError(`Could not make the card: ${err.message}`)
      }
    }, 300)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [open, to, message, from])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const ready = Boolean(to.trim() && preview)
  const fileName = `Sharodiya card for ${to.trim().replace(/[^\p{L}\p{N} ]/gu, '') || 'you'}.png`
  const file = ready ? new File([preview.blob], fileName, { type: 'image/png' }) : null
  const shareable = file && canShareFiles && navigator.canShare({ files: [file] })

  async function share() {
    try {
      await navigator.share({ files: [file], title: 'Shubho Sharodiya', text: `Shubho Sharodiya, ${to.trim()}!` })
    } catch (err) {
      if (err.name !== 'AbortError') setError('Sharing did not work here. Try Download instead.')
    }
  }

  return (
    <div className="card-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="card-dialog" role="dialog" aria-modal="true" aria-labelledby="card-title">
        <VineStrip className="card-vine" />
        <button type="button" className="card-close" onClick={onClose} aria-label="Close">
          ×
        </button>
        <div className="card-body">
          <div className="card-form">
            <h2 id="card-title">
              <span lang="bn">শুভ শারদীয়া</span> card
            </h2>
            <p className="card-sub">Make a Pujo greeting for someone special, then share or download it.</p>

            <label>
              To
              <input value={to} onChange={(e) => setTo(e.target.value)} placeholder="Their name, e.g. Didi" maxLength={40} required autoFocus />
            </label>

            <label>
              Message <small>(optional)</small>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, MAX_MESSAGE))}
                placeholder={DEFAULT_MESSAGE}
                rows={3}
              />
              <span className="card-count">
                {message.length}/{MAX_MESSAGE}
              </span>
            </label>
            <div className="card-ideas">
              <span>Ideas:</span>
              {SUGGESTED_MESSAGES.map((m, i) => (
                <button key={m} type="button" onClick={() => setMessage(m)} title={m}>
                  {['Blessings', 'Dhak & bhog', 'Family', 'Pandal hopping'][i]}
                </button>
              ))}
            </div>

            <label>
              From
              <input value={from} onChange={(e) => setFrom(e.target.value)} placeholder="Your name" maxLength={40} />
            </label>

            {error && <p className="card-error">{error}</p>}

            <div className="card-actions">
              {shareable && (
                <button type="button" className="card-btn primary" onClick={share}>
                  Share
                </button>
              )}
              {ready ? (
                <a className={`card-btn${shareable ? '' : ' primary'}`} href={preview.url} download={fileName}>
                  Download
                </a>
              ) : (
                <button type="button" className="card-btn primary" disabled>
                  {to.trim() ? 'Making your card…' : 'Add a name to make the card'}
                </button>
              )}
            </div>
          </div>

          <div className="card-preview">
            {to.trim() && preview ? (
              <img src={preview.url} alt={`Sharodiya card for ${to.trim()}`} />
            ) : (
              <div className="card-placeholder">Your card appears here as you type a name.</div>
            )}
          </div>
        </div>

        {/* Off-screen copy of the painting, used as the card's artwork */}
        <div ref={paintingRef} className="card-art-source" aria-hidden="true">
          <Painting />
        </div>
      </div>
    </div>
  )
}
