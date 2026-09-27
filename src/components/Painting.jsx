import { useId } from 'react'
import { VineBorder } from './Folk.jsx'
import { BLUE, CREAM, INK, OCHRE, PINK, RED, VERMILION, YELLOW } from './palette.js'

const CX = 300
const CY = 318 // centre of the chalchitra arch

function bezier(p0, p1, p2, t) {
  const u = 1 - t
  return [u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]]
}

// Upper half-ring between radii r and R around the arch centre.
function halfRing(r, R) {
  return `M${CX - R} ${CY} A${R} ${R} 0 0 1 ${CX + R} ${CY} L${CX + r} ${CY} A${r} ${r} 0 0 0 ${CX - r} ${CY} Z`
}

// Small white four-petal flower used on the sari.
function Flower({ x, y, s = 1 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill={CREAM}>
      <ellipse rx="2.2" ry="4.6" cy="-4" />
      <ellipse rx="2.2" ry="4.6" cy="4" />
      <ellipse rx="4.6" ry="2.2" cx="-4" />
      <ellipse rx="4.6" ry="2.2" cx="4" />
      <circle r="1.6" fill={YELLOW} />
    </g>
  )
}

// A seated folk deity figure for the chalchitra band, drawn upright around (0,0).
function ArchFigure({ skin, robe }) {
  return (
    <g stroke={INK} strokeWidth="1.5" strokeLinejoin="round">
      <circle cy="-15" r="12.5" fill={YELLOW} />
      <path d="M-10 -3 Q0 -8 10 -3 L15 23 H-15 Z" fill={robe} />
      <circle cx="-5" cy="10" r="1.6" fill={CREAM} stroke="none" />
      <circle cx="5" cy="15" r="1.6" fill={CREAM} stroke="none" />
      <path d="M-10 1 Q-16 10 -3 11 M10 1 Q16 10 3 11" fill="none" stroke={skin} strokeWidth="4" />
      <path d="M-10 1 Q-16 10 -3 11 M10 1 Q16 10 3 11" fill="none" strokeWidth="1" />
      <ellipse cy="-14" rx="7.5" ry="9" fill={skin} />
      <path d="M-7.6 -16 Q0 -27 7.6 -16 Q0 -21 -7.6 -16Z" fill={INK} />
      <path d="M-5.5 -13.5 q2.6 -1.8 4.4 0 M1.1 -13.5 q2.6 -1.8 4.4 0" fill="none" strokeWidth="1.2" />
      <circle cy="-19" r="1.2" fill={RED} stroke="none" />
    </g>
  )
}

const EMBLEMS = {
  arrow: (
    <g stroke={INK} strokeWidth="2" strokeLinejoin="round">
      <path d="M22 18 L-26 -22" strokeWidth="4" />
      <path d="M22 18 L-26 -22" stroke={CREAM} strokeWidth="1.6" />
      <path d="M-34 -30 L-18 -26 L-26 -18 Z" fill={CREAM} />
      <path d="M22 18 l6 -2 l-2 8 z" fill={PINK} />
    </g>
  ),
  sword: (
    <g stroke={INK} strokeWidth="2" strokeLinejoin="round">
      <path d="M8 -4 L-46 -18 L-40 -8 Z" fill={CREAM} />
      <path d="M8 -12 L4 6" strokeWidth="5" stroke={INK} />
      <path d="M8 -12 L4 6" strokeWidth="2.6" stroke={YELLOW} />
    </g>
  ),
  chakra: (
    <g stroke={INK} strokeWidth="2">
      <circle cx="-8" r="17" fill="none" strokeWidth="6" />
      <circle cx="-8" r="17" fill="none" stroke={CREAM} strokeWidth="3" />
      <circle cx="-8" r="4" fill={RED} />
    </g>
  ),
  conch: (
    <g stroke={INK} strokeWidth="2" strokeLinejoin="round">
      <path d="M-4 -8 Q-24 -14 -26 2 Q-24 14 -4 8 Q2 0 -4 -8Z" fill={CREAM} />
      <path d="M-20 -2 Q-14 -6 -8 -2" fill="none" strokeWidth="1.4" />
    </g>
  ),
  bell: (
    <g stroke={INK} strokeWidth="2" strokeLinejoin="round">
      <path d="M0 -6 V-18" strokeWidth="3" />
      <path d="M-10 -40 Q-10 -18 0 -18 Q10 -18 10 -40 Q0 -46 -10 -40Z" fill={YELLOW} transform="rotate(180 0 -29)" />
      <circle cy="-44" r="3" fill={YELLOW} />
    </g>
  ),
  axe: (
    <g stroke={INK} strokeWidth="2" strokeLinejoin="round">
      <path d="M-4 6 L10 -40" strokeWidth="4.5" />
      <path d="M-4 6 L10 -40" stroke={YELLOW} strokeWidth="2.2" />
      <path d="M6 -30 Q22 -40 26 -24 Q16 -22 8 -22 Z" fill={CREAM} />
    </g>
  ),
  bow: (
    <g stroke={INK} strokeWidth="2" fill="none">
      <path d="M10 -34 Q34 0 10 34" strokeWidth="5.5" />
      <path d="M10 -34 Q34 0 10 34" stroke={YELLOW} strokeWidth="3" />
      <path d="M10 -34 V34" strokeWidth="1.2" />
    </g>
  ),
  lotus: (
    <g stroke={INK} strokeWidth="1.6" strokeLinejoin="round">
      <path d="M8 -8 Q24 -30 30 -10 Q22 0 8 -8Z" fill={CREAM} />
      <path d="M8 -8 Q6 -34 20 -32 Q26 -18 8 -8Z" fill={CREAM} />
      <path d="M8 -8 Q32 -24 36 -2 Q24 6 8 -8Z" fill={CREAM} />
      <circle cx="20" cy="-14" r="3" fill={YELLOW} />
    </g>
  ),
}

// Eight fanned arms (four each side); the two front arms hold the trishul.
const ARMS = [
  { from: [262, 322], to: [124, 262], emblem: 'arrow' },
  { from: [258, 356], to: [104, 330], emblem: 'sword' },
  { from: [254, 392], to: [102, 396], emblem: 'chakra' },
  { from: [250, 426], to: [122, 444], emblem: 'conch' },
  { from: [338, 322], to: [476, 262], emblem: 'bell', flip: true },
  { from: [342, 356], to: [496, 330], emblem: 'axe', flip: true },
  { from: [346, 392], to: [498, 396], emblem: 'bow', flip: true },
  { from: [350, 426], to: [488, 438], emblem: 'lotus', flip: true },
]

function Arm({ from, to, emblem, flip }) {
  const [fx, fy] = from
  const [tx, ty] = to
  const mx = (fx + tx) / 2
  const my = (fy + ty) / 2 - 8
  const d = `M${fx} ${fy} Q${mx} ${my} ${tx} ${ty}`
  const bangle = (t, color) => {
    const [bx, by] = bezier(from, [mx, my], to, t)
    return <circle cx={bx} cy={by} r="9.5" fill="none" stroke={color} strokeWidth="3" />
  }
  return (
    <g>
      <path d={d} fill="none" stroke={INK} strokeWidth="21" strokeLinecap="round" />
      <path d={d} fill="none" stroke={OCHRE} strokeWidth="16" strokeLinecap="round" />
      {bangle(0.78, CREAM)}
      {bangle(0.84, RED)}
      {bangle(0.9, CREAM)}
      <g transform={`translate(${tx} ${ty})${flip ? ' scale(-1 1)' : ''}`}>{EMBLEMS[emblem]}</g>
      <circle cx={tx} cy={ty} r="11" fill={OCHRE} stroke={INK} strokeWidth="2.5" />
      <path d={`M${tx - 5} ${ty - 3} h10 M${tx - 5} ${ty + 2} h10`} stroke={INK} strokeWidth="1.2" />
    </g>
  )
}

// A folk eye: almond white with a black iris set toward the inner corner and a long kohl flick.
function FolkEye({ inner, outer, y, iris }) {
  const dir = outer < inner ? -1 : 1
  return (
    <g stroke={INK} strokeLinejoin="round">
      <path
        d={`M${inner} ${y + 2} C${inner + dir * 10} ${y - 10} ${outer - dir * 12} ${y - 12} ${outer} ${y - 4} C${outer - dir * 12} ${y + 8} ${inner + dir * 10} ${y + 8} ${inner} ${y + 2}Z`}
        fill={CREAM}
        strokeWidth="2.6"
      />
      <circle cx={iris} cy={y - 1} r="5.6" fill={INK} stroke="none" />
      <circle cx={iris - 1.6} cy={y - 2.8} r="1.4" fill={CREAM} stroke="none" />
      <path d={`M${outer} ${y - 4} l${dir * 9} -6`} fill="none" strokeWidth="2.6" strokeLinecap="round" />
    </g>
  )
}

function Lion() {
  const curls = Array.from({ length: 15 }, (_, i) => {
    const a = Math.PI * (0.95 + (i / 14) * 1.3)
    return [128 + Math.cos(a) * 74, 552 + Math.sin(a) * 66]
  })
  return (
    <g stroke={INK} strokeLinejoin="round">
      {curls.map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="21" fill={i % 2 ? '#d9661a' : '#c4531a'} strokeWidth="2.2" />
          <path d={`M${x - 8} ${y + 2} q2 -10 10 -8 q8 4 2 10 q-5 3 -6 -2`} fill="none" stroke="#7a2e0c" strokeWidth="2" />
        </g>
      ))}
      <path d="M70 520 L60 496 L86 510Z M186 520 L196 496 L170 510Z" fill={OCHRE} strokeWidth="2.2" />
      <ellipse cx="128" cy="556" rx="64" ry="54" fill={YELLOW} strokeWidth="3" />
      <path d="M92 532 Q108 522 122 530 M134 530 Q148 522 164 532" fill="none" strokeWidth="2.4" />
      <FolkEye inner={122} outer={86} y={546} iris={112} />
      <FolkEye inner={134} outer={170} y={546} iris={144} />
      <path d="M128 522 V534" stroke={RED} strokeWidth="3" strokeLinecap="round" />
      <path d="M116 566 Q128 558 140 566 Q134 576 128 576 Q122 576 116 566Z" fill={PINK} strokeWidth="2.2" />
      <path d="M128 576 V584 M110 588 Q128 600 146 588" fill="none" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M100 574 L74 568 M100 580 L76 584 M156 574 L182 568 M156 580 L180 584" strokeWidth="1.6" strokeLinecap="round" />
    </g>
  )
}

function Mahishasura() {
  const curls = Array.from({ length: 11 }, (_, i) => {
    const a = Math.PI * (1.02 + (i / 10) * 0.96)
    return [466 + Math.cos(a) * 46, 506 + Math.sin(a) * 50]
  })
  return (
    <g stroke={INK} strokeLinejoin="round">
      <path d="M392 600 Q404 562 444 556 L496 556 Q548 562 566 600 Z" fill={PINK} strokeWidth="3" />
      <path d="M420 600 L478 556 L500 560 L446 600Z" fill={BLUE} strokeWidth="2.2" />
      <circle cx="430" cy="580" r="2" fill={CREAM} stroke="none" />
      <circle cx="530" cy="584" r="2" fill={CREAM} stroke="none" />
      {curls.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="17" fill={INK} strokeWidth="1" />
      ))}
      <ellipse cx="466" cy="514" rx="40" ry="46" fill="#2f9a4a" strokeWidth="3" />
      <path d="M436 490 Q450 480 462 490 M470 490 Q482 480 496 490" fill="none" strokeWidth="4" strokeLinecap="round" />
      <FolkEye inner={462} outer={432} y={504} iris={450} />
      <FolkEye inner={472} outer={500} y={504} iris={482} />
      <path d="M466 474 V488" stroke={RED} strokeWidth="3.4" strokeLinecap="round" />
      <path d="M466 508 Q462 522 468 526" fill="none" strokeWidth="2" />
      <path d="M446 540 Q456 528 466 536 Q476 528 486 540 Q478 536 466 544 Q454 536 446 540Z" fill={INK} strokeWidth="1.5" />
      <path d="M436 530 q-8 -2 -8 -10 M496 530 q8 -2 8 -10" fill="none" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M458 550 Q466 554 474 550" fill="none" stroke={RED} strokeWidth="2.4" />
      <circle cx="426" cy="522" r="5" fill={YELLOW} strokeWidth="1.6" />
      {/* Shield */}
      <circle cx="424" cy="574" r="22" fill={YELLOW} strokeWidth="2.6" />
      <circle cx="424" cy="574" r="12" fill="none" stroke={RED} strokeWidth="2.4" />
      <path d="M440 590 Q448 578 440 566" fill="none" stroke="#2f9a4a" strokeWidth="11" strokeLinecap="round" />
    </g>
  )
}

// Maa Durga as a Bengal pat painting in the Jamini Roy manner: flat colour, bold outlines,
// long almond eyes; with her lion, Mahishasura, and a chalchitra of painted deities.
export function Painting({ className = '' }) {
  const id = useId()
  const figures = Array.from({ length: 9 }, (_, i) => -164 + i * 18.5)
  const robes = [PINK, '#1f9a6a', '#f28a1e', '#7fb0e0', YELLOW]
  const skins = [OCHRE, '#5a8fd8', OCHRE, '#7fc28f']
  const pearls = Array.from({ length: 21 }, (_, i) => bezier([248, 306], [300, 396], [352, 306], i / 20))
  const beads = Array.from({ length: 15 }, (_, i) => bezier([256, 304], [300, 362], [344, 304], i / 14))

  return (
    <svg className={`painting ${className}`} viewBox="0 0 600 600" role="img" aria-label="Maa Durga with her lion and Mahishasura, in folk painting style">
      <defs>
        <clipPath id={`${id}inner`}>
          <rect x="30" y="30" width="540" height="540" />
        </clipPath>
      </defs>

      <g clipPath={`url(#${id}inner)`}>
        <rect x="30" y="30" width="540" height="540" fill={PINK} />
        <rect x="30" y="318" width="540" height="252" fill={VERMILION} />

        {/* Chalchitra: petal band, dotted ring, deities on indigo, inner yellow band */}
        <path d={halfRing(244, 272)} fill={RED} stroke={INK} strokeWidth="2.5" />
        {Array.from({ length: 31 }, (_, i) => -180 + i * 6).map((a) => (
          <g key={a} transform={`rotate(${a + 90} ${CX} ${CY}) translate(${CX} ${CY - 244})`}>
            <path d="M0 0 C-8 -6 -8 -20 0 -27 C8 -20 8 -6 0 0Z" fill={YELLOW} stroke={INK} strokeWidth="1.6" />
            <path d="M0 -5 V-20" stroke={RED} strokeWidth="2" />
          </g>
        ))}
        <path d={halfRing(232, 244)} fill={INK} />
        {Array.from({ length: 46 }, (_, i) => -178 + i * 4).map((a) => {
          const r = (a * Math.PI) / 180
          return <circle key={a} cx={CX + 238 * Math.cos(r)} cy={CY + 238 * Math.sin(r)} r="2" fill={CREAM} />
        })}
        <path d={halfRing(160, 232)} fill={BLUE} stroke={INK} strokeWidth="2.5" />
        {figures.map((a, i) => (
          <g key={a} transform={`rotate(${a + 90} ${CX} ${CY}) translate(${CX} ${CY - 196})`}>
            <ArchFigure skin={skins[i % skins.length]} robe={robes[i % robes.length]} />
          </g>
        ))}
        <path d={halfRing(146, 160)} fill={YELLOW} stroke={INK} strokeWidth="2.5" />
        {Array.from({ length: 24 }, (_, i) => -176 + i * 7.6).map((a) => (
          <path key={a} d={`M${CX + 149 * Math.cos((a * Math.PI) / 180)} ${CY + 149 * Math.sin((a * Math.PI) / 180)} L${CX + 157 * Math.cos((a * Math.PI) / 180)} ${CY + 157 * Math.sin((a * Math.PI) / 180)}`} stroke={RED} strokeWidth="2.4" />
        ))}
        <path d={`M${CX - 146} ${CY} A146 146 0 0 1 ${CX + 146} ${CY} Z`} fill={VERMILION} />

        {/* Band across the painting with a white zigzag */}
        <rect x="30" y="298" width="540" height="24" fill="#7a3414" stroke={INK} strokeWidth="2.5" />
        <path d={`M30 310 ${Array.from({ length: 46 }, (_, i) => `L${30 + (i + 0.5) * 12} ${i % 2 ? 304 : 316}`).join(' ')}`} fill="none" stroke={CREAM} strokeWidth="2" />

        {/* Pink mandorla behind the goddess */}
        <circle cx="300" cy="372" r="186" fill={VERMILION} stroke={INK} strokeWidth="2.5" />
        <circle cx="300" cy="372" r="172" fill="none" stroke={PINK} strokeWidth="26" />
        <circle cx="300" cy="372" r="159" fill="none" stroke={INK} strokeWidth="2" />
        {Array.from({ length: 40 }, (_, i) => (i / 40) * Math.PI * 2).map((a, i) => (
          <ellipse key={i} cx={300 + 172 * Math.cos(a)} cy={372 + 172 * Math.sin(a)} rx="3" ry="6.5" fill={CREAM} transform={`rotate(${(a * 180) / Math.PI} ${300 + 172 * Math.cos(a)} ${372 + 172 * Math.sin(a)})`} />
        ))}

        {/* Hair falling behind */}
        <path d="M300 168 C248 168 234 206 240 252 C234 304 222 344 230 392 L370 392 C378 344 366 304 360 252 C366 206 352 168 300 168Z" fill={INK} />

        {/* The lion and Mahishasura sit behind Durga's arms, lifted fully into the frame */}
        <g transform="translate(128 514) scale(0.9) translate(-128 -556)">
          <Lion />
        </g>
        <g transform="translate(472 486) scale(0.9) translate(-466 -514)">
          <Mahishasura />
        </g>

        {ARMS.map((a) => (
          <Arm key={a.emblem} {...a} />
        ))}

        {/* Body in a red sari with pink border and white flowers */}
        <path d="M250 302 Q300 288 350 302 L394 572 H206 Z" fill={RED} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
        {[
          [270, 360], [330, 350], [236, 440], [290, 430], [350, 470], [250, 510], [320, 530], [370, 540], [230, 552],
        ].map(([x, y]) => (
          <Flower key={`${x}-${y}`} x={x} y={y} s={1.1} />
        ))}
        <path d="M250 302 L278 296 L396 480 L378 500 Z" fill={PINK} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
        {[0.2, 0.4, 0.6, 0.8].map((t) => (
          <Flower key={t} x={264 + (387 - 264) * t} y={299 + (490 - 299) * t} s={0.8} />
        ))}
        <path d="M212 540 H388 L394 572 H206 Z" fill={PINK} stroke={INK} strokeWidth="2.5" />
        {Array.from({ length: 14 }, (_, i) => (
          <circle key={i} cx={218 + i * 13} cy="556" r="2.4" fill={CREAM} />
        ))}

        {/* Neck and jewellery */}
        <path d="M287 280 V304 Q300 310 313 304 V280Z" fill={OCHRE} stroke={INK} strokeWidth="2.5" />
        {beads.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="3.4" fill={i % 2 ? '#1f9a6a' : RED} stroke={INK} strokeWidth="1" />
        ))}
        {pearls.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="3" fill={CREAM} stroke={INK} strokeWidth="0.9" />
        ))}
        <path d="M300 348 L314 368 L300 390 L286 368Z" fill={YELLOW} stroke={INK} strokeWidth="2.2" strokeLinejoin="round" />
        <circle cx="300" cy="369" r="5" fill={RED} stroke={INK} strokeWidth="1.2" />

        {/* Front arms holding the trishul down towards Mahishasura */}
        <path d="M296 360 L424 540" stroke={INK} strokeWidth="8" strokeLinecap="round" />
        <path d="M296 360 L424 540" stroke={YELLOW} strokeWidth="4.5" strokeLinecap="round" />
        <path d="M408 532 L432 550 M404 544 L418 524 M416 558 L436 536" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />
        {[
          'M346 314 Q370 370 332 404',
          'M254 318 Q236 420 356 452',
        ].map((d) => (
          <g key={d}>
            <path d={d} fill="none" stroke={INK} strokeWidth="21" strokeLinecap="round" />
            <path d={d} fill="none" stroke={OCHRE} strokeWidth="16" strokeLinecap="round" />
          </g>
        ))}
        <circle cx="332" cy="404" r="11" fill={OCHRE} stroke={INK} strokeWidth="2.5" />
        <circle cx="356" cy="452" r="11" fill={OCHRE} stroke={INK} strokeWidth="2.5" />
        <circle cx="340" cy="392" r="9.5" fill="none" stroke={CREAM} strokeWidth="3" />
        <circle cx="344" cy="446" r="9.5" fill="none" stroke={CREAM} strokeWidth="3" />

        {/* Face */}
        <path d="M300 180 C328 180 342 204 342 232 C342 262 324 284 300 290 C276 284 258 262 258 232 C258 204 272 180 300 180Z" fill={OCHRE} stroke={INK} strokeWidth="3" />
        <path d="M258 228 C261 194 282 182 300 182 C318 182 339 194 342 228 C334 206 318 197 300 197 C282 197 266 206 258 228Z" fill={INK} />
        <path d="M300 183 V197" stroke={RED} strokeWidth="3.2" strokeLinecap="round" />
        <path d="M258 218 Q278 205 296 215 M304 215 Q322 205 342 218" fill="none" stroke={INK} strokeWidth="2.6" strokeLinecap="round" />
        <FolkEye inner={296} outer={260} y={234} iris={284} />
        <FolkEye inner={304} outer={340} y={234} iris={316} />
        <path d="M300 199 Q306.5 208.5 300 218 Q293.5 208.5 300 199Z" fill={CREAM} stroke={RED} strokeWidth="2" />
        <circle cx="300" cy="208.5" r="3" fill={INK} />
        <path d="M299 222 Q296 246 297 257 Q301 261 305 257" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round" />
        <circle cx="311" cy="263" r="9" fill="none" stroke={INK} strokeWidth="4.5" />
        <circle cx="311" cy="263" r="9" fill="none" stroke={CREAM} strokeWidth="2.2" />
        <path d="M289 273 Q294.5 268.5 300 270.5 Q305.5 268.5 311 273 Q300 279 289 273Z" fill="#d4141f" stroke={INK} strokeWidth="1.2" />
        {[256, 344].map((x) => (
          <g key={x} stroke={INK} strokeWidth="1.8">
            <circle cx={x} cy="270" r="15" fill={CREAM} />
            <circle cx={x} cy="270" r="10" fill={RED} />
            <circle cx={x} cy="270" r="4.5" fill={CREAM} />
          </g>
        ))}

        {/* Crown */}
        <path d="M262 190 L266 160 L278 170 L286 146 L300 128 L314 146 L322 170 L334 160 L338 190 Z" fill={CREAM} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M272 184 L276 166 M300 138 V178 M328 184 L324 166 M288 180 L292 154 M312 180 L308 154" stroke={YELLOW} strokeWidth="2.6" />
        <path d="M262 188 Q300 178 338 188 L338 198 Q300 188 262 198 Z" fill={YELLOW} stroke={INK} strokeWidth="2.2" />
        <path d="M300 146 L308 158 L300 170 L292 158Z" fill={RED} stroke={INK} strokeWidth="1.6" />
        {[272, 286, 314, 328].map((x) => (
          <circle key={x} cx={x} cy="192" r="2.2" fill={RED} />
        ))}

      </g>

      <VineBorder x={0} y={0} w={600} h={600} band={30} />
    </svg>
  )
}

