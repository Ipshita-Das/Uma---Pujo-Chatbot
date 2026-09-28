import { useEffect, useRef, useState } from 'react'
import './App.css'
import { api } from './api.js'
import { AuthCard } from './components/AuthCard.jsx'
import { CardMaker } from './components/CardMaker.jsx'
import { AlpanaFloor, CurtainIntro, FolkDhak, FolkDhunuchi, PetalBand } from './components/Folk.jsx'
import { Garlands, KolaBou, ShankhaWoman } from './components/Extras.jsx'
import { Painting } from './components/Painting.jsx'
import { Dhaki, DhunuchiDancer } from './components/People.jsx'
import { Reply } from './components/Reply.jsx'
import { Sidebar } from './components/Sidebar.jsx'
import { ThinkingLine } from './components/ThinkingLine.jsx'

const SUGGESTIONS = [
  { icon: '☕', text: 'Best places for pujor adda in South Kolkata?' },
  { icon: '🛕', text: 'Plan a North Kolkata pandal-hopping route for Saptami' },
  { icon: '🥻', text: 'What should I wear for Ashtami anjali?' },
  { icon: '🍢', text: 'Must-try Pujo street food near Maddox Square' },
]

// Shrink photos before upload so requests stay small and fast.
function resizeImage(file, maxSize = 1024) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(img.src)
      resolve(canvas.toDataURL('image/jpeg', 0.85))
    }
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

// The pujo scene as a folk painting: Maa Durga's pat flanked by dhakis and dhunuchi
// dancers on an alpana floor, with Kola Bou, a conch player and marigold strings filling
// the wide-screen wings. It is the welcome screen, and stays behind the chat.
function Scene() {
  return (
    <div className="scene">
      <div className="scene-row">
        <div className="wing wing-left">
          <Garlands className="wing-garlands" />
          <KolaBou className="wing-figure" />
        </div>
        <div className="people people-left">
          <Dhaki variant="b" className="p2" delay={-0.6} />
          <Dhaki className="p1" />
        </div>
        <Painting className="scene-painting" />
        <div className="people people-right">
          <DhunuchiDancer className="p1" />
          <DhunuchiDancer variant="b" className="p2" delay={-1.1} />
        </div>
        <div className="wing wing-right">
          <Garlands mirror className="wing-garlands" />
          <ShankhaWoman className="wing-figure" />
        </div>
      </div>
      <div className="floor">
        <AlpanaFloor />
      </div>
    </div>
  )
}

const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

function App() {
  // Launch curtain: 'closed' -> 'rising' -> 'gone'
  const [curtain, setCurtain] = useState(reduceMotion ? 'gone' : 'closed')
  // undefined while checking the session, null when logged out
  const [user, setUser] = useState(undefined)
  const [chats, setChats] = useState([])
  const [activeChatId, setActiveChatId] = useState(null)
  const [messages, setMessages] = useState([])
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [cardOpen, setCardOpen] = useState(false)
  const [chatLoading, setChatLoading] = useState(false)
  const [input, setInput] = useState('')
  const [image, setImage] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef(null)
  const endRef = useRef(null)
  const activeRef = useRef(null) // chat on screen, so late replies for another chat are ignored
  const pendingSeq = useRef(0)

  useEffect(() => {
    if (curtain !== 'closed') return
    const t = setTimeout(() => setCurtain('rising'), 1500)
    return () => clearTimeout(t)
  }, [curtain])

  // Restore the session on load.
  useEffect(() => {
    api('/api/auth/me')
      .then(({ user }) => setUser(user))
      .catch(() => setUser(null))
  }, [])

  // Load the chat list whenever someone logs in.
  useEffect(() => {
    if (!user) return
    api('/api/chats')
      .then(({ chats }) => setChats(chats))
      .catch((err) => setError(err.message))
  }, [user])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  function resetChat() {
    activeRef.current = null
    setActiveChatId(null)
    setMessages([])
    setError('')
    setInput('')
    setImage(null)
  }

  function handleError(err) {
    if (err.status === 401) {
      resetChat()
      setChats([])
      setUser(null)
      return
    }
    setError(err.message)
  }

  function newChat() {
    resetChat()
    setDrawerOpen(false)
  }

  async function openChat(id) {
    setDrawerOpen(false)
    if (id === activeChatId) return
    activeRef.current = id
    setActiveChatId(id)
    setMessages([])
    setError('')
    setChatLoading(true)
    try {
      const { messages } = await api(`/api/chats/${id}`)
      if (activeRef.current === id) setMessages(messages)
    } catch (err) {
      handleError(err)
    } finally {
      setChatLoading(false)
    }
  }

  async function renameChat(chat) {
    const title = window.prompt('Rename this chat', chat.title)?.trim()
    if (!title || title === chat.title) return
    try {
      await api(`/api/chats/${chat.id}`, { method: 'PATCH', body: { title } })
      setChats((list) => list.map((c) => (c.id === chat.id ? { ...c, title } : c)))
    } catch (err) {
      handleError(err)
    }
  }

  async function deleteChat(chat) {
    if (!window.confirm(`Delete "${chat.title}"? This can't be undone.`)) return
    try {
      await api(`/api/chats/${chat.id}`, { method: 'DELETE' })
      setChats((list) => list.filter((c) => c.id !== chat.id))
      if (chat.id === activeChatId) resetChat()
    } catch (err) {
      handleError(err)
    }
  }

  async function logout() {
    await api('/api/auth/logout', { method: 'POST', body: {} }).catch(() => {})
    setDrawerOpen(false)
    resetChat()
    setChats([])
    setUser(null)
  }

  async function pickImage(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      setImage(await resizeImage(file))
    } catch {
      setError('Could not read that image. Try a JPG or PNG.')
    }
  }

  async function send(text) {
    const trimmed = text.trim()
    if ((!trimmed && !image) || loading || !user) return

    const sentImage = image
    const chatId = activeChatId
    const pending = {
      id: `pending-${++pendingSeq.current}`,
      role: 'user',
      text: trimmed || 'What outfit would go well with this?',
      image: sentImage,
    }
    setMessages((m) => [...m, pending])
    setInput('')
    setImage(null)
    setError('')
    setLoading(true)

    try {
      const data = await api('/api/messages', { method: 'POST', body: { chatId, text: trimmed, image: sentImage } })
      setChats((list) => [data.chat, ...list.filter((c) => c.id !== data.chat.id)])
      if (activeRef.current === chatId) {
        activeRef.current = data.chat.id
        setActiveChatId(data.chat.id)
        // Photos aren't stored, so keep this one on screen for the rest of the session only.
        setMessages((m) => [...m.filter((x) => x.id !== pending.id), { ...data.userMessage, image: sentImage }, data.reply])
      }
    } catch (err) {
      setMessages((m) => m.filter((x) => x.id !== pending.id))
      setInput(trimmed)
      setImage(sentImage)
      handleError(err)
    } finally {
      setLoading(false)
    }
  }

  const chatting = messages.length > 0 || chatLoading
  const firstName = user?.name.split(' ')[0]

  return (
    <div className="app">
      {curtain !== 'gone' && (
        <CurtainIntro
          rising={curtain === 'rising'}
          onRise={() => setCurtain('rising')}
          onDone={() => setCurtain('gone')}
        />
      )}
      <header className="header">
        <div className="header-inner">
          {user && (
            <button
              type="button"
              className="menu-btn"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open your chats"
              aria-expanded={drawerOpen}
            >
              <span />
              <span />
              <span />
            </button>
          )}
          <FolkDhak className="header-dhak" />
          <div className="title">
            <h1>Uma</h1>
            <p>Pandals, adda, bhog and outfits: ask me anything about Durga Puja</p>
          </div>
          <FolkDhunuchi className="header-dhunuchi" />
        </div>
        <PetalBand className="header-petals" />
      </header>

      {user && (
        <Sidebar
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          user={user}
          chats={chats}
          activeChatId={activeChatId}
          onNewChat={newChat}
          onOpenChat={openChat}
          onRenameChat={renameChat}
          onDeleteChat={deleteChat}
          onLogout={logout}
          onMakeCard={() => {
            setDrawerOpen(false)
            setCardOpen(true)
          }}
        />
      )}
      {user && <CardMaker open={cardOpen} onClose={() => setCardOpen(false)} fromName={firstName} />}
      {user === null && curtain !== 'closed' && <AuthCard onAuthed={setUser} />}

      <div className="stage">
        {chatting && (
          <div className="backdrop" aria-hidden="true">
            <Scene />
          </div>
        )}
        <main className={`chat${chatting ? ' chatting' : ''}`}>
          {!chatting && (
            <section className="hero">
              <Scene />
              <div className="greeting">
                <p className="bn">
                  <span lang="bn">শুভ শারদীয়া</span>
                  {firstName && <span className="greet-name">, {firstName}!</span>}
                </p>
                <p className="tagline">Ask me about pandals, adda spots and bhog, or upload a photo for outfit ideas.</p>
                {user && (
                  <button type="button" className="card-entry" onClick={() => setCardOpen(true)}>
                    <span aria-hidden="true">💌</span> Make a Sharodiya card
                  </button>
                )}
              </div>
              {user && (
                <div className="suggestions">
                  {SUGGESTIONS.map(({ icon, text }) => (
                    <button key={text} type="button" onClick={() => send(text)}>
                      <span className="s-icon" aria-hidden="true">{icon}</span>
                      <span>{text}</span>
                    </button>
                  ))}
                </div>
              )}
              {error && <div className="error hero-error">{error}</div>}
            </section>
          )}

          {chatting && (
            <div className="thread">
              {chatLoading && (
                <div className="msg assistant typing">
                  <FolkDhak className="typing-dhak" />
                  <span>Opening your chat…</span>
                </div>
              )}
              {messages.map((m) => (
                <div key={m.id} className={`msg ${m.role}`}>
                  {m.image && <img src={m.image} alt="Uploaded" />}
                  {!m.image && m.had_photo && <span className="photo-gone">📷 Photo not saved</span>}
                  {m.role === 'assistant' ? <Reply text={m.text} /> : <p>{m.text}</p>}
                </div>
              ))}
              {loading && (
                <div className="msg assistant typing">
                  <FolkDhak className="typing-dhak" />
                  <ThinkingLine />
                </div>
              )}
              {error && <div className="error">{error}</div>}
              <div ref={endRef} />
            </div>
          )}
        </main>
      </div>

      {user && (
        <form
          className="composer"
          onSubmit={(e) => {
            e.preventDefault()
            send(input)
          }}
        >
          <div className="composer-inner">
            {image && (
              <div className="preview-row">
                <div className="preview">
                  <img src={image} alt="Selected" />
                  <button type="button" onClick={() => setImage(null)} aria-label="Remove photo">
                    ×
                  </button>
                </div>
                <p className="preview-note">Photos are only used for this reply and are never saved.</p>
              </div>
            )}
            <div className="row">
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickImage} />
              <button
                type="button"
                className="attach"
                onClick={() => fileRef.current?.click()}
                aria-label="Attach photo"
              >
                📷
              </button>
              <input
                className="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about pandals, adda, outfits…"
                maxLength={2000}
              />
              <button type="submit" className="sendBtn" disabled={loading}>
                Send
              </button>
            </div>
            <p className="disclaimer">
              Uma is an AI and can make mistakes.<span className="disclaimer-more"> Please double-check important details like timings.</span>{' '}
              <a href="/privacy.html">Privacy</a> · <a href="/terms.html">Terms</a>
            </p>
          </div>
        </form>
      )}
    </div>
  )
}

export default App
