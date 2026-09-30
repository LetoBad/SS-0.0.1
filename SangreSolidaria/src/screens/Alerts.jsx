import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import {
  findConversationForAlert,
  listDonorAlerts,
  markAlertRead,
} from '../lib/db.js'

function Alerts({ onNavigate, onOpenChat }) {
  const { user } = useAuth()
  const [alerts, setAlerts] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user?.id) return
    listDonorAlerts(user.id)
      .then(setAlerts)
      .catch((err) => setError(err.message))
  }, [user])

  async function handleOpenChat(alert) {
    try {
      const chat = await findConversationForAlert({
        userId: user.id,
        conversationId: alert.conversacion_id,
        requestId: alert.solicitud_id,
      })
      if (!chat) {
        setError('El chat todavía no está desbloqueado para esta petición.')
        return
      }
      onOpenChat(chat.id)
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleRead(id) {
    try {
      await markAlertRead(id)
      setAlerts((current) =>
        current.map((alert) =>
          alert.id === id ? { ...alert, leida: true } : alert
        )
      )
    } catch (err) {
      setError(err.message)
    }
  }

  if (!user) {
    return (
      <main className="page">
        <div className="page-card">
          <h1>Alertas</h1>
          <p>Iniciá sesión para ver si aceptaron tu petición o si hay solicitudes cercanas.</p>
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
        <span className="tag">Avisos</span>
        <h1>Alertas</h1>
        <p>
          Acá ves si un donante aceptó tu petición de
          sangre y, si donás, las solicitudes compatibles
          dentro de tu radio.
        </p>

        {error ? <p className="form-error">{error}</p> : null}

        <div className="request-list">
          {alerts.length === 0 ? (
            <p className="muted">No tenés alertas por ahora.</p>
          ) : (
            alerts.map((alert) => (
              <article key={alert.id} className="request-card">
                <div>
                  <strong>{alert.titulo}</strong>
                  <p>{alert.mensaje}</p>
                  <p>
                    {alert.tipo === 'peticion_aceptada'
                      ? 'Petición aceptada'
                      : 'Proximidad'}
                    {' · '}
                    {alert.leida ? 'Leída' : 'Nueva'}
                  </p>
                </div>
                <div className="request-actions">
                  {alert.tipo === 'peticion_aceptada' ? (
                    <button
                      className="btn-primary"
                      type="button"
                      onClick={() => handleOpenChat(alert)}
                    >
                      Abrir chat
                    </button>
                  ) : null}
                  {!alert.leida ? (
                    <button
                      className="btn-secondary"
                      type="button"
                      onClick={() => handleRead(alert.id)}
                    >
                      Marcar como leída
                    </button>
                  ) : null}
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </main>
  )
}

export default Alerts
