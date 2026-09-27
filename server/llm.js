import { OFF_TOPIC, SYSTEM_PROMPT } from './systemPrompt.js'

const env = (name, fallback = '') => (process.env[name] ?? fallback).trim()
const list = (value) => value.split(',').map((m) => m.trim()).filter(Boolean)

// AI providers, tried in order. Both speak the OpenAI chat-completions format.
// Free plans limit tokens per minute (Groq) or requests per minute/day (Gemini) for each model,
// so when one model is busy or failing the next one takes over.
const PROVIDERS = [
  {
    name: 'Groq',
    baseUrl: env('GROQ_BASE_URL', 'https://api.groq.com/openai/v1'),
    apiKey: env('GROQ_API_KEY'),
    textModels: list(env('GROQ_TEXT_MODELS', 'openai/gpt-oss-120b,openai/gpt-oss-20b')),
    visionModels: list(env('GROQ_VISION_MODELS', 'qwen/qwen3.8-27b')),
    // gpt-oss models think before answering; keep that short and out of the reply.
    params: (model) => (model.startsWith('openai/gpt-oss') ? { reasoning_effort: 'low', include_reasoning: false } : {}),
  },
  {
    name: 'Gemini',
    baseUrl: env('GEMINI_BASE_URL', 'https://generativelanguage.googleapis.com/v1beta/openai'),
    apiKey: env('GEMINI_API_KEY'),
    textModels: list(env('GEMINI_MODELS', 'gemini-3.8-flash,gemini-3.5-flash-lite')),
    visionModels: list(env('GEMINI_MODELS', 'gemini-3.8-flash,gemini-3.5-flash-lite')),
    params: () => ({}),
  },
].filter((p) => p.apiKey)

export const hasApiKey = PROVIDERS.length > 0
export const describeProviders = () =>
  PROVIDERS.map((p) => `${p.name} (text: ${p.textModels.join(', ')}; photos: ${p.visionModels.join(', ')})`).join(' → ') ||
  'none'

const MAX_HISTORY = 16 // messages sent per request
const MAX_OUTPUT_TOKENS = 2048
const DEFAULT_COOLDOWN_MS = 20_000

// Fixed replies used when the model flags a request as outside Durga Puja.
const REDIRECTS = [
  'Ami shudhu Pujo niye adda dite pari! 🪔 Pandal, bhog, outfit, ritual: kichhu jiggesh korbe?',
  "Oi bishoy ta amar para-r baire, bondhu. Let's talk Pujo instead: pandal hopping plan, Ashtami outfit, or bhog?",
  "I'm all about Durga Puja, so that one's not for me. Ask me about pandals, adda spots, food or what to wear!",
]

export class LlmError extends Error {}

// Converts messages ({ role, text, image, had_photo }) to the OpenAI-compatible format.
// Off-topic exchanges are left out. Photos are never stored, so only the message being
// answered can carry one; earlier photos become a short text note.
function toApiMessages(history) {
  const recent = history.filter((m) => !m.off_topic).slice(-MAX_HISTORY)
  return recent.map(({ role, text, image, had_photo }) => {
    if (!image) return { role, content: had_photo ? `(shared a photo earlier, no longer available) ${text}` : text }
    return {
      role,
      content: [
        { type: 'text', text },
        { type: 'image_url', image_url: { url: image } },
      ],
    }
  })
}

const today = () =>
  new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' })

// Tells the model who it is talking to (so it can greet them by name) and today's date.
function aboutUser(user) {
  const name = user.name.replace(/[^\p{L}\p{M}\s.'-]/gu, '').slice(0, 60)
  return [
    '# Who you are talking to',
    `The user's name is ${name}. Use their first name now and then, warmly, the way a friend would.`,
    'They are signed in and their past chats are saved.',
    '',
    '# Today',
    `Today is ${today()} in India. Use it for questions like "how many days until Ashtami?".`,
  ].join('\n')
}

// Models that recently hit a rate limit are skipped until this time (ms since epoch).
const coolingUntil = new Map()

function cooldownMs(res, data) {
  const header = Number(res.headers.get('retry-after'))
  if (header > 0) return header * 1000
  // Groq says "try again in 21.5s"; Gemini says "retry in 39.4s".
  const message = data?.error?.message ?? (Array.isArray(data) ? data[0]?.error?.message : '') ?? ''
  const hinted = /(?:try again|retry) in ([\d.]+)s/i.exec(message)
  return hinted ? Math.ceil(Number(hinted[1]) * 1000) : DEFAULT_COOLDOWN_MS
}

// One request to one model. Returns { ok, text } or { ok: false, status }.
async function complete(provider, model, messages) {
  let res
  try {
    res = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${provider.apiKey}` },
      body: JSON.stringify({ model, messages, temperature: 0.6, max_tokens: MAX_OUTPUT_TOKENS, ...provider.params(model) }),
      signal: AbortSignal.timeout(45_000),
    })
  } catch (err) {
    console.error(`${provider.name} ${model}: request failed (${err.name})`)
    return { ok: false, status: 0 }
  }

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const message = data?.error?.message ?? (Array.isArray(data) ? data[0]?.error?.message : '') ?? ''
    console.error(`${provider.name} ${model}: ${res.status} ${String(message).slice(0, 200)}`)
    if (res.status === 429) coolingUntil.set(`${provider.name}/${model}`, Date.now() + cooldownMs(res, data))
    return { ok: false, status: res.status }
  }
  return { ok: true, text: data.choices?.[0]?.message?.content ?? '' }
}

// Asks the models in order until one answers. Returns { text, offTopic }.
export async function askModel(history, user) {
  if (!hasApiKey) throw new LlmError('The server has no AI key set. Add GROQ_API_KEY or GEMINI_API_KEY to .env and restart.')

  const messages = [{ role: 'system', content: `${SYSTEM_PROMPT}\n\n${aboutUser(user)}` }, ...toApiMessages(history)]
  const hasPhoto = messages.some((m) => Array.isArray(m.content))
  const candidates = PROVIDERS.flatMap((p) => (hasPhoto ? p.visionModels : p.textModels).map((model) => ({ provider: p, model })))
  const ready = candidates.filter(({ provider, model }) => (coolingUntil.get(`${provider.name}/${model}`) ?? 0) <= Date.now())

  let busy = ready.length < candidates.length
  for (const { provider, model } of ready) {
    const result = await complete(provider, model, messages)
    if (result.ok) {
      // Reasoning models can wrap their thinking in <think> tags; never show that to the user.
      const text = result.text.replace(/<think>[\s\S]*?<\/think>/g, '').trim()
      if (!text || text.includes(OFF_TOPIC)) {
        return { text: REDIRECTS[Math.floor(Math.random() * REDIRECTS.length)], offTopic: true }
      }
      return { text, offTopic: false }
    }
    if (result.status === 429) busy = true
  }

  if (busy) throw new LlmError('Uma is very busy right now. Please try again in a minute.')
  throw new LlmError('Uma could not reach the AI service just now. Please try again.')
}
