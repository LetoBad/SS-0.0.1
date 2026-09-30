import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import {
  getConversation,
  listChatMessages,
  markChatRead,
  sendChatMessage,
} from '../lib/db.js'

function ChatThread({ conversationId, onNavigate }) {
  const { user } = useAuth()
  const [conversation, setConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const endRef = useRef(null)

  useEffect(() => {
    if (!user?.id || !conversationId) return

    let cancelled = false

    async function load() {
      try {
        const [conv, rows] = await Promise.all([
          getConversation(conversationId, user.id),
          listChatMessages(conversationId, user.id),
        ])
        if (cancelled) return
        setConversation(conv)
        setMessages(rows)
        await markChatRead(conversationId, user.id)
      } catch (err) {
        if (!cancelled) setError(err.message)
      }
    }

    load()
    const timer = window.setInterval(load, 2500)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [user?.id, conversationId])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  async function handleSend(event) {
    event.preventDefault()
    const body = text.trim()
    if (!body || !user?.id) return

    setError('')
    setSending(true)
    try {
      const created = await sendChatMessage({
        conversationId,
        userId: user.id,
        body,
      })
      setMessages((current) => [...current, created])
      setText('')
    } catch (err) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  if (!user) {
    return (
      <main className="page">
        <div className="page-card">
          <h1>Chat</h1>
          <p>Iniciá sesión para ver el chat.</p>
          <button className="btn-primary" onClick={() => onNavigate('login')}>
            Iniciar sesión
          </button>
        </div>
      </main>
    )
  }

  if (!conversationId) {
    return (
      <main className="page">
        <div className="page-card">
          <h1>Chat</h1>
          <p>Elegí una conversación desbloqueada.</p>
          <button className="btn-secondary" onClick={() => onNavigate('chats')}>
            Ver chats
          </button>
        </div>
      </main>
    )
  }

  const otherName =
    conversation?.donante_usuario_id === user.id
      ? conversation?.receptor_nombre
      : conversation?.donante_nombre

  return (
    <main className="page">
      <div className="page-card page-wide">
        <span className="tag">Chat desbloqueado</span>
        <h1>{otherName || 'Conversación'}</h1>
        <p>
          {conversation
            ? `${conversation.nombre_paciente} · ${conversation.hospital}, ${conversation.ciudad}`
            : 'Coordiná los siguientes pasos.'}
        </p>

        <button className="btn-secondary" type="button" onClick={() => onNavigate('chats')}>
          Volver a chats
        </button>

        {error ? <p className="form-error">{error}</p> : null}

        <div className="chat-thread">
          {messages.length === 0 ? (
            <p className="muted">Todavía no hay mensajes. Escribí el primero.</p>
          ) : (
            messages.map((message) => {
              const mine = message.remitente_id === user.id
              return (
                <div
                  key={message.id}
                  className={`chat-bubble ${mine ? 'chat-bubble-mine' : 'chat-bubble-other'}`}
                >
                  <p>{message.cuerpo}</p>
                </div>
              )
            })
          )}
          <div ref={endRef} />
        </div>

        <form className="chat-compose" onSubmit={handleSend}>
          <input
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Escribí un mensaje"
            maxLength={1000}
          />
          <button className="btn-primary" type="submit" disabled={sending || !text.trim()}>
            Enviar
          </button>
        </form>
      </div>
    </main>
  )
}

export default ChatThread
