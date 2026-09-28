import { useEffect, useState } from 'react'

const LINES = [
  'Dhaker taale bhabchi…',
  'Uma bhabchhe…',
  'Ektu dnarao, pandal ghure ashchi…',
  'Dhunuchi jalachhi, ektu wait…',
  'Adda jomchhe, uttor ashchhe…',
  'Panjika ghatchhi…',
  'Kumartuli theke khobor anchhi…',
  'Bhog-er line-e dnariye achhi…',
  'উমা ভাবছে…',
  'একটু দাঁড়াও…',
  'Uma is thinking…',
  'Tuning the dhak…',
  'Asking around the para…',
]
const EVERY_MS = 2200

// The waiting message under the beating dhak: cycles through Pujo lines, starting at a random one.
export function ThinkingLine() {
  const [index, setIndex] = useState(() => Math.floor(Math.random() * LINES.length))

  useEffect(() => {
    const timer = setInterval(() => setIndex((i) => (i + 1) % LINES.length), EVERY_MS)
    return () => clearInterval(timer)
  }, [])

  const line = LINES[index]
  return (
    <span key={index} className="thinking-line" lang={/[ঀ-৿]/.test(line) ? 'bn' : undefined} aria-live="polite">
      {line}
    </span>
  )
}
