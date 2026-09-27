import { CREAM, INK, OCHRE, PINK, RED, TEAL, YELLOW } from './palette.js'
import './Extras.css'

const LEAVES = [
  { a: -58, l: 96 },
  { a: -34, l: 110 },
  { a: -12, l: 118 },
  { a: 12, l: 116 },
  { a: 34, l: 108 },
  { a: 56, l: 94 },
]

// Kola Bou: the banana-plant bride of Saptami, wrapped in a red-bordered sari with a veil.
export function KolaBou({ className = '' }) {
  return (
    <svg className={`extra kola-bou ${className}`} viewBox="-10 -30 140 272" aria-hidden="true">
      <g stroke={INK} strokeLinejoin="round">
        <g className="kola-leaves">
          {LEAVES.map(({ a, l }) => (
            <g key={a} transform={`rotate(${a} 60 104)`}>
              <path d={`M60 104 C44 ${104 - l * 0.35} 46 ${104 - l * 0.85} 60 ${104 - l} C74 ${104 - l * 0.85} 76 ${104 - l * 0.35} 60 104Z`} fill="#2f9a4a" strokeWidth="2.2" />
              <path d={`M60 104 V${104 - l + 6}`} stroke="#bfe0a0" strokeWidth="1.6" />
              {[0.3, 0.5, 0.7].map((t) => (
                <path key={t} d={`M60 ${104 - l * t} l-9 -7 M60 ${104 - l * t} l9 -7`} stroke="#1f7a3a" strokeWidth="1.2" />
              ))}
            </g>
          ))}
        </g>
        {/* Terracotta pot at the base */}
        <path d="M34 214 Q30 240 60 240 Q90 240 86 214 Z" fill="#c4531a" strokeWidth="2.2" />
        <path d="M40 222 Q60 230 80 222" fill="none" stroke={CREAM} strokeWidth="2" />
        {/* Sari wrapped round the trunk, with veil and red border */}
        <path d="M40 104 Q60 94 80 104 L90 218 H30 Z" fill={CREAM} strokeWidth="2.4" />
        <path d="M32 206 H88 L90 218 H30 Z" fill={RED} strokeWidth="2" />
        <path d="M57 106 L54 216 M63 106 L66 216" stroke={RED} strokeWidth="4" />
        <path d="M36 112 Q60 78 84 112 Q60 100 36 112Z" fill={CREAM} strokeWidth="2.2" />
        <path d="M37 111 Q60 86 83 111" fill="none" stroke={RED} strokeWidth="3.4" />
        <circle cx="60" cy="98" r="3.2" fill={RED} strokeWidth="1.2" />
        {[40, 50, 70, 80].map((x) => (
          <circle key={x} cx={x} cy="212" r="1.6" fill={YELLOW} stroke="none" />
        ))}
      </g>
    </svg>
  )
}

// A woman in a festive red sari blowing a shankha (conch), with sound curls.
export function ShankhaWoman({ className = '' }) {
  const skin = OCHRE
  return (
    <svg className={`extra shankha-woman ${className}`} viewBox="0 -24 150 224" aria-hidden="true">
      <g className="shankha-body" stroke={INK} strokeLinejoin="round">
        {/* Sari: vermilion with a yellow border */}
        <path d="M42 108 Q60 102 80 108 L94 194 H26 Z" fill={RED} strokeWidth="2.2" />
        {[52, 57, 62, 67].map((x) => (
          <path key={x} d={`M${x} 118 L${x + (x - 60) * 0.4} 180`} strokeWidth="1.1" />
        ))}
        <path d="M28 180 Q60 185 92 180 L94 194 H26 Z" fill={YELLOW} strokeWidth="2" />
        {[36, 48, 60, 72, 84].map((x) => (
          <circle key={x} cx={x} cy="188" r="1.6" fill={RED} stroke="none" />
        ))}
        <path d="M43 92 H77 L80 108 H40 Z" fill={skin} strokeWidth="2" />
        <path d="M44 70 Q60 64 76 70 L78 92 H42 Z" fill={TEAL} strokeWidth="2" />
        <path d="M44 69 L55 65 L85 112 L74 118 Z" fill={RED} strokeWidth="2" />
        <path d="M47 70 L76 116 M53 67 L83 112" stroke={YELLOW} strokeWidth="3" />

        {/* Head */}
        <circle cx="60" cy="21" r="9" fill={INK} strokeWidth="1" />
        {Array.from({ length: 9 }, (_, i) => {
          const a = (i / 9) * Math.PI * 2
          return <circle key={i} cx={60 + Math.cos(a) * 9} cy={21 + Math.sin(a) * 9} r="2" fill={PINK} strokeWidth="1" />
        })}
        <path d="M56 52 H64 V66 H56Z" fill={skin} strokeWidth="1.8" />
        <ellipse cx="60" cy="40" rx="11" ry="15" fill={skin} strokeWidth="2.2" />
        <path d="M49 39 Q48 25 60 25 Q72 25 71 39 Q68 30 60 29.5 Q52 30 49 39Z" fill={INK} strokeWidth="1" />
        <path d="M60 25.5 V30" stroke={RED} strokeWidth="1.8" strokeLinecap="round" />
        <path d="M51 38 q3.6 -2.2 7 0 M62 38 q3.6 -2.2 7 0" fill="none" strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="60" cy="33" r="1.9" fill={RED} stroke="none" />
        <path d="M52 66 Q60 72 68 66" fill="none" stroke={YELLOW} strokeWidth="2.4" />

        {/* Arms raised, holding the conch to her lips */}
        {[
          [[44, 72], [48, 58], [62, 50]],
          [[76, 72], [88, 62], [80, 50]],
        ].map((pts, i) => {
          const d = `M${pts.map((p) => p.join(' ')).join(' L')}`
          return (
            <g key={i}>
              <path d={d} fill="none" strokeWidth="9.4" strokeLinecap="round" />
              <path d={d} fill="none" stroke={skin} strokeWidth="6" strokeLinecap="round" />
              <circle cx={pts[2][0]} cy={pts[2][1]} r="3.7" fill={skin} strokeWidth="1.4" />
            </g>
          )
        })}
        <path d="M58 48 Q62 38 80 38 Q96 40 98 46 Q94 54 78 55 Q64 56 58 48Z" fill={CREAM} strokeWidth="2" />
        <path d="M66 46 Q74 42 86 44" fill="none" strokeWidth="1.2" />
        <path d="M92 42 q4 4 0 8" fill="none" strokeWidth="1.2" />
      </g>
      <g className="shankha-sound" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round">
        <path d="M106 38 q6 8 0 16" />
        <path d="M114 32 q10 14 0 28" />
        <path d="M122 26 q14 20 0 40" />
      </g>
    </svg>
  )
}

const STRINGS = [
  { x: 40, n: 6 },
  { x: 100, n: 9 },
  { x: 160, n: 5 },
  { x: 220, n: 8 },
  { x: 280, n: 4 },
]
const BEAD_GAP = 10

// Strings of marigold hanging from above, each ending in a small bell; they sway gently.
export function Garlands({ className = '', mirror = false }) {
  return (
    <svg
      className={`garlands ${className}`}
      viewBox="0 0 304 240"
      preserveAspectRatio={mirror ? 'xMinYMin slice' : 'xMaxYMin slice'}
      aria-hidden="true"
    >
      {STRINGS.map(({ x, n }, i) => {
        const cx = mirror ? 304 - x : x
        const end = 6 + n * BEAD_GAP
        return (
          <g key={x} className="garland-string" style={{ transformOrigin: `${cx}px 0px`, animationDelay: `${-i * 0.37}s` }}>
            <line x1={cx} y1="0" x2={cx} y2={end} stroke={INK} strokeWidth="1.4" />
            {Array.from({ length: n }, (_, k) => (
              <circle key={k} cx={cx} cy={6 + k * BEAD_GAP} r="4.6" fill={k % 3 === 2 ? YELLOW : '#f07f14'} stroke={INK} strokeWidth="1.2" />
            ))}
            <path d={`M${cx - 4} ${end + 8} Q${cx - 4} ${end} ${cx} ${end} Q${cx + 4} ${end} ${cx + 4} ${end + 8} Z`} fill={YELLOW} stroke={INK} strokeWidth="1.2" />
          </g>
        )
      })}
    </svg>
  )
}
