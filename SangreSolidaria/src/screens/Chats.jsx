import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { listMyConversations } from '../lib/db.js'

function Chats({ onNavigate, onOpenChat }) {
  const { user } = useAuth()
  const [chats, setChats] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user?.id) return

    let cancelled = false

    async function load() {
      try {
        const data = await listMyConversations(user.id)
        if (!cancelled) setChats(data)
      } catch (err) {
        if (!cancelled) setError(err.message)
      }
    }

    load()
    const timer = window.setInterval(load, 8000)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [user?.id])

  if (!user) {
    return (
      <main className="page">
        <div className="page-card">
          <h1>Chat</h1>
          <p>
            Iniciá sesión. El chat se desbloquea cuando un
            donante acepta una petición de sangre.
          </p>
          <button className="btn-primary" onClick={() => onNavigate('login')}>
            Iniciar sesión
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="page">
      <div className="page-card page-wide">
        <span className="tag">Coordinación</span>
        <h1>Chat</h1>
        <p>
          Solo se habilita entre donante y receptor después
          de aceptar la petición.
        </p>

        {error ? <p className="form-error">{error}</p> : null}

        <div className="request-list">
          {chats.length === 0 ? (
            <p className="muted">
              Todavía no tenés chats desbloqueados.
            </p>
          ) : (
            chats.map((chat) => {
              const otherName =
                chat.donante_usuario_id === user.id
                  ? chat.receptor_nombre
                  : chat.donante_nombre
              const roleLabel =
                chat.donante_usuario_id === user.id
                  ? 'Receptor'
                  : 'Donante'

              return (
                <article key={chat.id} className="request-card">
                  <div>
                    <strong>
                      {roleLabel}: {otherName}
                    </strong>
                    <p>
                      {chat.nombre_paciente} · {chat.hospital},{' '}
                      {chat.ciudad}
                    </p>
                    <p>
                      {chat.ultimo_mensaje || 'Chat desbloqueado. Escribí el primer mensaje.'}
                    </p>
                  </div>
                  <div className="request-actions">
                    {chat.no_leidos > 0 ? (
                      <span className="chat-unread">{chat.no_leidos} nuevo(s)</span>
                    ) : null}
                    <button
                      className="btn-primary"
                      type="button"
                      onClick={() => onOpenChat(chat.id)}
                    >
                      Abrir chat
                    </button>
                  </div>
                </article>
              )
            })
          )}
        </div>
      </div>
    </main>
  )
}

export default Chats
