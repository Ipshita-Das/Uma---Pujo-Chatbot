import { useId } from 'react'
import { CREAM, INK, PINK, RED, TEAL, VERMILION, YELLOW } from './palette.js'
import './Folk.css'

// White vine-scroll tile on teal, `b` units tall and 40 wide (horizontal run).
function VineTile({ b }) {
  const m = b / 2
  return (
    <>
      <rect width="40" height={b} fill={TEAL} />
      <path d={`M0 ${m} C10 ${b * 0.12} 20 ${b * 0.12} 20 ${m} S30 ${b * 0.88} 40 ${m}`} fill="none" stroke={CREAM} strokeWidth="2.2" />
      <ellipse cx="9" cy={b * 0.3} rx="2.4" ry="5" fill={CREAM} transform={`rotate(-40 9 ${b * 0.3})`} />
      <ellipse cx="31" cy={b * 0.7} rx="2.4" ry="5" fill={CREAM} transform={`rotate(-40 31 ${b * 0.7})`} />
      <circle cx="20" cy={b * 0.22} r="1.6" fill={CREAM} />
      <circle cx="0" cy={b * 0.78} r="1.6" fill={CREAM} />
      <circle cx="40" cy={b * 0.78} r="1.6" fill={CREAM} />
    </>
  )
}

// A painted teal frame with white vine scrolls, for use inside another SVG.
export function VineBorder({ x = 0, y = 0, w, h, band = 30 }) {
  const id = useId()
  return (
    <g>
      <defs>
        <pattern id={`${id}h`} width="40" height={band} patternUnits="userSpaceOnUse" x={x} y={y}>
          <VineTile b={band} />
        </pattern>
        <pattern id={`${id}v`} width="40" height={band} patternUnits="userSpaceOnUse" patternTransform={`translate(${x + band} ${y}) rotate(90)`}>
          <VineTile b={band} />
        </pattern>
      </defs>
      <rect x={x} y={y} width={w} height={band} fill={`url(#${id}h)`} />
      <rect x={x} y={y + h - band} width={w} height={band} fill={`url(#${id}h)`} />
      <rect x={x} y={y + band} width={band} height={h - band * 2} fill={`url(#${id}v)`} />
      <rect x={x + w - band} y={y + band} width={band} height={h - band * 2} fill={`url(#${id}v)`} />
      <rect x={x + 1.5} y={y + 1.5} width={w - 3} height={h - 3} fill="none" stroke={INK} strokeWidth="3" />
      <rect x={x + band} y={y + band} width={w - band * 2} height={h - band * 2} fill="none" stroke={INK} strokeWidth="3" />
    </g>
  )
}

// A standalone vertical or horizontal vine strip that stretches to fill its box.
export function VineStrip({ vertical = false, className = '' }) {
  const id = useId()
  const band = 30
  return (
    <svg className={`vine-strip ${className}`} aria-hidden="true" preserveAspectRatio="none">
      <defs>
        <pattern
          id={id}
          width="40"
          height={band}
          patternUnits="userSpaceOnUse"
          patternTransform={vertical ? `translate(${band} 0) rotate(90)` : undefined}
        >
          <VineTile b={band} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  )
}

const PETAL_W = 26
const PETALS = 96

// Hanging row of painted petals (like the chalchitra's rim) that sways gently.
export function PetalBand({ className = '' }) {
  const width = PETAL_W * PETALS
  return (
    <svg className={`petal-band ${className}`} viewBox={`0 0 ${width} 46`} preserveAspectRatio="xMidYMin slice" aria-hidden="true">
      <rect width={width} height="12" fill={RED} />
      <line x1="0" y1="12" x2={width} y2="12" stroke={INK} strokeWidth="3" />
      {Array.from({ length: PETALS * 2 }, (_, i) => (
        <circle key={i} cx={6 + i * (PETAL_W / 2)} cy="6" r="1.8" fill={CREAM} />
      ))}
      {Array.from({ length: PETALS }, (_, i) => {
        const x = PETAL_W / 2 + i * PETAL_W
        return (
          <g key={i} className="petal" style={{ transformOrigin: `${x}px 13px`, animationDelay: `${-i * 0.23}s` }}>
            <path d={`M${x} 13 C${x - 10} 20 ${x - 10} 34 ${x} 43 C${x + 10} 34 ${x + 10} 20 ${x} 13Z`} fill={i % 4 === 2 ? PINK : YELLOW} stroke={INK} strokeWidth="2" />
            <path d={`M${x} 18 V36`} stroke={RED} strokeWidth="2.2" />
          </g>
        )
      })}
    </svg>
  )
}

// Terracotta floor strip painted with white alpana: lotuses, loops and dots.
export function AlpanaFloor({ className = '' }) {
  const id = useId()
  return (
    <svg className={`alpana ${className}`} aria-hidden="true" preserveAspectRatio="none">
      <defs>
        <pattern id={id} width="140" height="40" patternUnits="userSpaceOnUse">
          <rect width="140" height="40" fill="#a8401e" />
          {Array.from({ length: 8 }, (_, k) => (
            <ellipse key={k} cx="70" cy="20" rx="2.2" ry="5" fill={CREAM} transform={`rotate(${k * 45} 70 20) translate(0 -6.5)`} />
          ))}
          <circle cx="70" cy="20" r="2.8" fill={YELLOW} stroke={CREAM} strokeWidth="1" />
          <path d="M0 20 C12 11 22 11 28 20 C34 29 18 29 18 20 M140 20 C128 11 118 11 112 20 C106 29 122 29 122 20 M40 20 H56 M84 20 H100" fill="none" stroke={CREAM} strokeWidth="1.6" />
          {[10, 35, 60, 80, 105, 130].map((x) => (
            <g key={x}>
              <circle cx={x} cy="4.5" r="1.4" fill={CREAM} />
              <circle cx={x} cy="35.5" r="1.4" fill={CREAM} />
            </g>
          ))}
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  )
}

// Small folk dhak with a beating stick, for the header and the "thinking" bubble.
export function FolkDhak({ className = '' }) {
  return (
    <svg className={`folk-dhak ${className}`} viewBox="0 0 64 60" aria-hidden="true">
      <g stroke={INK} strokeWidth="1.8" strokeLinejoin="round">
        {[-30, -12, 6].map((a) => (
          <path key={a} d="M20 30 C16 22 17 10 20 3 C23 10 24 22 20 30Z" fill={CREAM} transform={`rotate(${a} 20 30)`} />
        ))}
        <path d="M8 30 Q32 25 56 30 V50 Q32 55 8 50 Z" fill={RED} />
        <path d="M15 29 V52 M49 29 V52" stroke={YELLOW} strokeWidth="3" />
        <path d="M15 29 V52 M49 29 V52" fill="none" strokeWidth="0.8" />
        <ellipse cx="8" cy="40" rx="4" ry="10" fill={CREAM} />
        <ellipse cx="56" cy="40" rx="4" ry="10" fill={CREAM} />
        <path className="folk-dhak-stick" d="M62 8 L57 36" strokeWidth="3.2" strokeLinecap="round" />
      </g>
    </svg>
  )
}

// Small folk dhunuchi with flame and curling smoke.
export function FolkDhunuchi({ className = '' }) {
  return (
    <svg className={`folk-dhunuchi ${className}`} viewBox="0 0 44 64" aria-hidden="true">
      <g className="folk-smoke" fill="none" stroke={CREAM} strokeWidth="2.6" strokeLinecap="round">
        <path d="M22 26 c-6 -6 6 -10 0 -16 c-5 -5 4 -8 0 -10" />
        <path d="M17 26 c-5 -5 3 -9 -2 -14" />
      </g>
      <g stroke={INK} strokeWidth="1.8" strokeLinejoin="round">
        <path className="folk-flame" d="M22 30 C17 25 20 19 22 15 C24 19 27 25 22 30Z" fill={YELLOW} />
        <path d="M6 30 Q8 44 22 45 Q36 44 38 30 Z" fill="#c4531a" />
        <path d="M11 36 Q22 40 33 36" fill="none" stroke={CREAM} strokeWidth="1.6" />
        <path d="M18 45 L16 56 H28 L26 45Z" fill="#c4531a" />
        <ellipse cx="22" cy="58" rx="11" ry="3.5" fill="#a8401e" />
      </g>
    </svg>
  )
}

// Maa's eyes: two long almond eyes and the third eye, as painted on a pat.
function MaaEyes() {
  return (
    <svg className="maa-eyes" viewBox="0 0 220 80" aria-hidden="true">
      <g stroke={INK} strokeWidth="3.4" strokeLinejoin="round">
        <path d="M104 50 C90 30 50 28 16 40 C50 62 90 62 104 50Z" fill={CREAM} />
        <path d="M116 50 C130 30 170 28 204 40 C170 62 130 62 116 50Z" fill={CREAM} />
        <circle cx="84" cy="46" r="10" fill={INK} />
        <circle cx="136" cy="46" r="10" fill={INK} />
        <path d="M16 40 L4 30 M204 40 L216 30" fill="none" strokeLinecap="round" />
        <path d="M110 4 Q120 20 110 36 Q100 20 110 4Z" fill={CREAM} stroke={YELLOW} />
        <circle cx="110" cy="20" r="4.5" fill={INK} stroke="none" />
      </g>
      <circle cx="80.5" cy="42.5" r="2.6" fill={CREAM} />
      <circle cx="132.5" cy="42.5" r="2.6" fill={CREAM} />
    </svg>
  )
}

// Launch curtain: a painted vermilion cloth with vine borders and a petal fringe; it rises to welcome the user.
export function CurtainIntro({ rising, onRise, onDone }) {
  return (
    <div
      className={`curtain-intro${rising ? ' rising' : ''}`}
      style={{ '--vermilion': VERMILION }}
      onClick={onRise}
      onAnimationEnd={(e) => {
        if (e.target === e.currentTarget && rising) onDone()
      }}
      role="presentation"
    >
      <VineStrip className="curtain-vine top" />
      <VineStrip vertical className="curtain-vine left" />
      <VineStrip vertical className="curtain-vine right" />
      <div className="curtain-welcome">
        <MaaEyes />
        <p className="curtain-bn" lang="bn">শুভ শারদীয়া</p>
        <div className="curtain-medallion">
          <img src="/uma-wordmark.webp" alt="Uma" width="640" height="387" />
        </div>
        <p className="curtain-hint">welcomes you</p>
      </div>
      <PetalBand className="curtain-petals" />
    </div>
  )
}
