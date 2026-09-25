import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { listDonorAlerts, markAlertRead } from '../lib/db.js'

function Alerts({ onNavigate }) {
  const { user } = useAuth()
  const [alerts, setAlerts] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user?.id) return
    listDonorAlerts(user.id)
      .then(setAlerts)
      .catch((err) => setError(err.message))
  }, [user])

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
          <p>Iniciá sesión para ver las solicitudes cercanas.</p>
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
        <span className="tag">Avisos de proximidad</span>
        <h1>Alertas</h1>
        <p>
          Solo aparecen solicitudes compatibles que están
          dentro del radio que configuraste.
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
                  <p>{alert.leida ? 'Leída' : 'Nueva'}</p>
                </div>
                {!alert.leida ? (
                  <button
                    className="btn-secondary"
                    type="button"
                    onClick={() => handleRead(alert.id)}
                  >
                    Marcar como leída
                  </button>
                ) : null}
              </article>
            ))
          )}
        </div>
      </div>
    </main>
  )
}

export default Alerts
