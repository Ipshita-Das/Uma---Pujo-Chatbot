import { useEffect } from 'react'
import { VineStrip } from './Folk.jsx'
import { CardIcon, CloseIcon, PencilIcon, PlusIcon, TrashIcon } from './Icons.jsx'
import './Sidebar.css'

function when(ms) {
  const d = new Date(ms)
  const today = new Date()
  const days = Math.floor((new Date(today.toDateString()) - new Date(d.toDateString())) / 86400000)
  if (days === 0) return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  if (days === 1) return 'Yesterday'
  if (days < 7) return d.toLocaleDateString([], { weekday: 'long' })
  return d.toLocaleDateString([], { day: 'numeric', month: 'short' })
}

// Slide-in drawer with the user's saved chats, a new-chat button and log out.
export function Sidebar({ open, onClose, user, chats, activeChatId, onNewChat, onOpenChat, onRenameChat, onDeleteChat, onLogout, onMakeCard }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <>
      <div className={`drawer-scrim${open ? ' open' : ''}`} onClick={onClose} aria-hidden="true" />
      <aside className={`drawer${open ? ' open' : ''}`} aria-label="Your chats" aria-hidden={!open} inert={!open}>
        <div className="drawer-head">
          <h2>Your chats</h2>
          <button type="button" className="drawer-close" onClick={onClose} aria-label="Close menu">
            <CloseIcon size={16} />
          </button>
        </div>

        <button type="button" className="drawer-new" onClick={onNewChat}>
          <PlusIcon size={18} /> New chat
        </button>
        <button type="button" className="drawer-card" onClick={onMakeCard}>
          <CardIcon size={18} /> Sharodiya card
        </button>

        <nav className="drawer-list">
          {chats.length === 0 && <p className="drawer-empty">No chats yet. Ask me anything about Pujo!</p>}
          {chats.map((c) => (
            <div key={c.id} className={`drawer-item${c.id === activeChatId ? ' active' : ''}`}>
              <button type="button" className="drawer-open" onClick={() => onOpenChat(c.id)}>
                <span className="drawer-title">{c.title}</span>
                <span className="drawer-when">{when(c.updated_at)}</span>
              </button>
              <button type="button" className="drawer-icon" onClick={() => onRenameChat(c)} aria-label={`Rename "${c.title}"`} title="Rename">
                <PencilIcon size={16} />
              </button>
              <button type="button" className="drawer-icon" onClick={() => onDeleteChat(c)} aria-label={`Delete "${c.title}"`} title="Delete">
                <TrashIcon size={16} />
              </button>
            </div>
          ))}
        </nav>

        <div className="drawer-foot">
          <span className="drawer-avatar" aria-hidden="true">
            {user.avatar ? <img src={user.avatar} alt="" referrerPolicy="no-referrer" /> : user.name.slice(0, 1).toUpperCase()}
          </span>
          <span className="drawer-user">
            <strong>{user.name}</strong>
            <small>{user.email}</small>
          </span>
          <button type="button" className="drawer-logout" onClick={onLogout}>
            Log out
          </button>
        </div>
        <VineStrip vertical className="drawer-vine" />
      </aside>
    </>
  )
}
