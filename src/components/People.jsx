import { CREAM, INK, OCHRE, RED, TEAL, YELLOW } from './palette.js'
import './People.css'

// A bent limb from shoulder to hand as one outlined stroke, with an optional short sleeve.
function Limb({ points, skin, width = 7, sleeve }) {
  const d = `M${points.map((p) => p.join(' ')).join(' L')}`
  const [sx, sy] = points[0]
  const [hx, hy] = points[points.length - 1]
  const [ex, ey] = points[1]
  return (
    <g>
      <path d={d} fill="none" stroke={INK} strokeWidth={width + 3.4} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke={skin} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
      {sleeve && (
        <>
          <path d={`M${sx} ${sy} L${sx + (ex - sx) * 0.42} ${sy + (ey - sy) * 0.42}`} stroke={INK} strokeWidth={width + 6.4} strokeLinecap="round" />
          <path d={`M${sx} ${sy} L${sx + (ex - sx) * 0.42} ${sy + (ey - sy) * 0.42}`} stroke={sleeve} strokeWidth={width + 3.2} strokeLinecap="round" />
        </>
      )}
      <circle cx={hx} cy={hy} r={width * 0.62} fill={skin} stroke={INK} strokeWidth="1.6" />
    </g>
  )
}

// Folk almond eye with the iris toward the inner corner.
function Eye({ x, y, dir }) {
  return (
    <g stroke={INK} strokeLinejoin="round">
      <path d={`M${x} ${y} C${x + dir * 3} ${y - 3.4} ${x + dir * 8} ${y - 3.6} ${x + dir * 11} ${y - 1.2} C${x + dir * 8} ${y + 2.4} ${x + dir * 3} ${y + 2.4} ${x} ${y}Z`} fill={CREAM} strokeWidth="1.3" />
      <circle cx={x + dir * 4} cy={y - 0.4} r="1.9" fill={INK} stroke="none" />
      <path d={`M${x + dir * 11} ${y - 1.2} l${dir * 3.2} -2`} strokeWidth="1.3" strokeLinecap="round" />
    </g>
  )
}

const FEATHERS = [-40, -28, -16, -4, 8]

// Dhaki: a bare-chested drummer in a white dhoti with a teal gamchha, beating a plumed dhak.
export function Dhaki({ variant = 'a', className = '', delay = 0 }) {
  const skin = variant === 'a' ? '#c4702e' : '#a95a26'
  return (
    <svg className={`person dhaki ${className}`} viewBox="0 0 120 200" style={{ '--d': `${delay}s` }} aria-hidden="true">
      <g className="ppl-bob" stroke={INK} strokeLinejoin="round">
        {/* Dhoti with red border, bare feet */}
        <path d="M42 134 L36 190 L57 190 L60 150 L63 190 L84 190 L78 134 Z" fill={CREAM} strokeWidth="2.2" />
        <path d="M38 180 L56 180 M64 180 L82 180" stroke={RED} strokeWidth="4" />
        <path d="M49 148 L47 176 M71 148 L73 176" strokeWidth="1.2" />
        <ellipse cx="46" cy="193" rx="8" ry="3" fill={skin} strokeWidth="1.6" />
        <ellipse cx="74" cy="193" rx="8" ry="3" fill={skin} strokeWidth="1.6" />

        {/* Bare torso with gamchha */}
        <path d="M42 72 Q60 64 78 72 L80 136 H40 Z" fill={skin} strokeWidth="2.2" />
        <path d="M52 92 Q56 96 60 92 Q64 96 68 92" fill="none" strokeWidth="1.2" />
        <path d="M42 71 L53 66 L82 122 L73 128 Z" fill={variant === 'a' ? TEAL : RED} strokeWidth="1.8" />
        <path d="M46 73 L76 126 M50 70 L79 123" stroke={CREAM} strokeWidth="1.1" strokeDasharray="3 3" />

        {/* Head: long oval, big almond eyes, moustache */}
        <path d="M55 52 H65 V66 H55Z" fill={skin} strokeWidth="1.8" />
        <ellipse cx="60" cy="40" rx="12" ry="16" fill={skin} strokeWidth="2.2" />
        <path d="M48 38 Q47 22 60 22 Q73 22 72 38 Q69 29 60 29 Q51 29 48 38Z" fill={INK} strokeWidth="1" />
        {variant === 'b' && <path d="M48 32 Q60 26 72 32 L72 36 Q60 30 48 36 Z" fill={RED} strokeWidth="1.4" />}
        <path d="M50 35.5 Q54 33 58 35 M62 35 Q66 33 70 35.5" fill="none" strokeWidth="1.4" />
        <Eye x={58.5} y={40} dir={-1} />
        <Eye x={61.5} y={40} dir={1} />
        <path d="M60 41 Q58.5 46 60 48" fill="none" strokeWidth="1.2" />
        <path d="M52 50 Q60 46 68 50 Q60 52.5 52 50Z" fill={INK} strokeWidth="1" />
        <path d="M60 27.5 V33" stroke={RED} strokeWidth="1.8" strokeLinecap="round" />

        {/* Strap */}
        <path d="M78 72 L30 104" stroke={INK} strokeWidth="3.2" />
        <path d="M78 72 L30 104" stroke="#8a4a1f" strokeWidth="1.6" />

        {/* Dhak with kash plume */}
        <g className="ppl-plume">
          {FEATHERS.map((a) => (
            <path key={a} d="M28 104 C22 86 24 62 28 48 C32 62 34 86 28 104Z" transform={`rotate(${a} 28 104)`} fill={CREAM} strokeWidth="1.5" />
          ))}
        </g>
        <path d="M16 104 Q60 97 104 104 L104 137 Q60 144 16 137 Z" fill={RED} strokeWidth="2.4" />
        <path d="M26 102 V139 M94 102 V139" stroke={INK} strokeWidth="5.6" />
        <path d="M26 102 V139 M94 102 V139" stroke={YELLOW} strokeWidth="3" />
        <polyline points="30,109 90,115 30,122 90,129 30,134" fill="none" stroke={CREAM} strokeWidth="1.4" />
        <ellipse cx="16" cy="120.5" rx="6" ry="16.5" fill={CREAM} strokeWidth="2.2" />
        <ellipse cx="104" cy="120.5" rx="6" ry="16.5" fill={CREAM} strokeWidth="2.2" />

        {/* Arms and sticks */}
        <g className="ppl-arm-a" style={{ transformOrigin: '43px 74px' }}>
          <Limb points={[[43, 74], [52, 96], [76, 99]]} skin={skin} />
          <path d="M76 99 L108 109" strokeWidth="2" strokeLinecap="round" />
        </g>
        <g className="ppl-arm-b" style={{ transformOrigin: '77px 74px' }}>
          <Limb points={[[77, 74], [91, 92], [96, 100]]} skin={skin} />
          <path d="M96 100 L110 117" strokeWidth="4" strokeLinecap="round" />
        </g>
      </g>
    </svg>
  )
}

// A clay dhunuchi held at (x, y) = the hand, with flame and curling smoke.
function HandDhunuchi({ x, y }) {
  return (
    <g stroke={INK} strokeLinejoin="round">
      <g className="ppl-smoke" fill="none" strokeLinecap="round">
        <path d={`M${x} ${y - 16} c-7 -8 7 -14 0 -22 c-7 -8 5 -14 0 -22`} />
        <path d={`M${x - 3} ${y - 16} c-7 -8 5 -14 -2 -22 c-7 -8 4 -14 -3 -22`} />
        <path d={`M${x + 3} ${y - 16} c7 -8 -5 -14 2 -22 c7 -8 -4 -14 3 -22`} />
      </g>
      <path className="ppl-flame" d={`M${x} ${y - 13} c-4 -4 -2 -9 0 -13 c2 4 4 9 0 13z`} fill={YELLOW} strokeWidth="1.2" />
      <path d={`M${x - 11} ${y - 14} Q${x - 10} ${y - 3} ${x} ${y - 2} Q${x + 10} ${y - 3} ${x + 11} ${y - 14} Z`} fill="#c4531a" strokeWidth="1.8" />
      <path d={`M${x - 7} ${y - 9} Q${x} ${y - 6} ${x + 7} ${y - 9}`} fill="none" stroke={CREAM} strokeWidth="1.2" />
      <path d={`M${x - 2.5} ${y - 2} L${x - 3} ${y + 2} H${x + 3} L${x + 2.5} ${y - 2}Z`} fill="#a8401e" strokeWidth="1.2" />
    </g>
  )
}

// A woman in lal-paar sada saree doing dhunuchi naach, a dhunuchi raised in each hand.
export function DhunuchiDancer({ variant = 'a', className = '', delay = 0 }) {
  const skin = variant === 'a' ? OCHRE : '#e0922a'
  const blouse = variant === 'a' ? RED : TEAL
  return (
    <svg className={`person dancer ${className}`} viewBox="0 -34 120 234" style={{ '--d': `${delay}s` }} aria-hidden="true">
      <g className="ppl-sway" stroke={INK} strokeLinejoin="round">
        {/* Saree skirt: white with a broad red border and pleats */}
        <path d="M42 108 Q60 102 80 108 L94 194 H26 Z" fill={CREAM} strokeWidth="2.2" />
        {[52, 57, 62, 67].map((x) => (
          <path key={x} d={`M${x} 118 L${x + (x - 60) * 0.4} 180`} strokeWidth="1.1" />
        ))}
        <path d="M28 180 Q60 185 92 180 L94 194 H26 Z" fill={RED} strokeWidth="2" />
        {[36, 48, 60, 72, 84].map((x) => (
          <circle key={x} cx={x} cy="188" r="1.6" fill={YELLOW} stroke="none" />
        ))}

        {/* Blouse, midriff and pallu */}
        <path d="M43 92 H77 L80 108 H40 Z" fill={skin} strokeWidth="2" />
        <path d="M44 70 Q60 64 76 70 L78 92 H42 Z" fill={blouse} strokeWidth="2" />
        <path d="M44 69 L55 65 L85 112 L74 118 Z" fill={CREAM} strokeWidth="2" />
        <path d="M47 70 L76 116 M53 67 L83 112" stroke={RED} strokeWidth="3.4" />

        {/* Head: bun with jasmine, sindoor, bindi, long almond eyes */}
        <circle cx="60" cy="21" r="9" fill={INK} strokeWidth="1" />
        {Array.from({ length: 9 }, (_, i) => {
          const a = (i / 9) * Math.PI * 2
          return <circle key={i} cx={60 + Math.cos(a) * 9} cy={21 + Math.sin(a) * 9} r="2" fill={CREAM} strokeWidth="1" />
        })}
        <path d="M56 52 H64 V66 H56Z" fill={skin} strokeWidth="1.8" />
        <ellipse cx="60" cy="40" rx="11" ry="15" fill={skin} strokeWidth="2.2" />
        <path d="M49 39 Q48 25 60 25 Q72 25 71 39 Q68 30 60 29.5 Q52 30 49 39Z" fill={INK} strokeWidth="1" />
        <path d="M60 25.5 V30" stroke={RED} strokeWidth="1.8" strokeLinecap="round" />
        <path d="M50.5 36 Q54.5 33.6 58.4 35.4 M61.6 35.4 Q65.5 33.6 69.5 36" fill="none" strokeWidth="1.3" />
        <Eye x={58.6} y={40} dir={-1} />
        <Eye x={61.4} y={40} dir={1} />
        <circle cx="60" cy="33" r="1.9" fill={RED} stroke="none" />
        <path d="M60 41 Q58.6 45 60 47" fill="none" strokeWidth="1.1" />
        <path d="M56.5 50 Q60 48 63.5 50 Q60 52.5 56.5 50Z" fill="#d4141f" strokeWidth="0.9" />
        <circle cx="49" cy="46" r="2" fill={YELLOW} strokeWidth="1" />
        <circle cx="71" cy="46" r="2" fill={YELLOW} strokeWidth="1" />
        <path d="M52 66 Q60 72 68 66" fill="none" stroke={YELLOW} strokeWidth="2.4" />

        {/* Arms with shakha-pola, each lifting a dhunuchi */}
        <g className="ppl-arm-a" style={{ transformOrigin: '44px 72px' }}>
          <Limb points={[[44, 72], [27, 84], [22, 62]]} skin={skin} width={6} sleeve={blouse} />
          <path d="M20 69 l6 -0.8" stroke={CREAM} strokeWidth="2.2" />
          <path d="M20 72.5 l6 -0.8" stroke={RED} strokeWidth="2.2" />
          <HandDhunuchi x={22} y={58} />
        </g>
        <g className="ppl-arm-b" style={{ transformOrigin: '76px 72px' }}>
          <Limb points={[[76, 72], [93, 54], [87, 30]]} skin={skin} width={6} sleeve={blouse} />
          <path d="M85 38.5 l6.4 -1.4" stroke={CREAM} strokeWidth="2.2" />
          <path d="M86 42 l6.4 -1.4" stroke={RED} strokeWidth="2.2" />
          <HandDhunuchi x={87} y={26} />
        </g>
      </g>
    </svg>
  )
}

