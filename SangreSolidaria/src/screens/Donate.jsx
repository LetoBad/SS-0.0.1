import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { listActiveRequests, offerDonation } from '../lib/db.js'

function Donate({ onNavigate }) {
  const { user } = useAuth()
  const [requests, setRequests] = useState([])
  const [notes, setNotes] = useState('')
  const [date, setDate] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    listActiveRequests()
      .then(setRequests)
      .catch((err) => setError(err.message))
  }, [])

  async function handleOffer(requestId) {
    if (!user?.donante_id) {
      setError('Necesitás una cuenta de donante para ofrecer sangre.')
      return
    }

    setError('')
    setMessage('')
    setLoading(true)

    try {
      await offerDonation({
        donorId: user.donante_id,
        requestId,
        notes,
        date,
      })
      setMessage('Donación registrada. El solicitante podrá verla.')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <main className="page">
        <div className="page-card">
          <span className="tag">Salvá una vida</span>
          <h1>Hacer una donación</h1>
          <p>Para ofrecer una donación, primero iniciá sesión o registrate como donante.</p>
          <div className="hero-buttons">
            <button className="btn-primary" onClick={() => onNavigate('login')}>
              Iniciar sesión
            </button>
            <button className="btn-secondary" onClick={() => onNavigate('registro')}>
              Registrarse
            </button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="page">
      <div className="page-card page-wide">
        <span className="tag">Salvá una vida</span>
        <h1>Hacer una donación</h1>
        <p>
          Elegí una solicitud activa. La donación se guarda
          uniendo tu perfil de donante con esa solicitud.
        </p>

        {!user.donante_id ? (
          <p className="form-error">
            Tu cuenta no tiene perfil de donante. Registrate
            como donante para poder ofrecer sangre.
          </p>
        ) : null}

        <form className="form" onSubmit={(event) => event.preventDefault()}>
          <label>
            Fecha disponible
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </label>
          <label>
            Comentarios
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Horarios, centro de salud preferido, etc."
              rows={3}
            />
          </label>
        </form>

        <div className="request-list">
          {requests.length === 0 ? (
            <p className="muted">No hay solicitudes activas por ahora.</p>
          ) : (
            requests.map((request) => (
              <article key={request.id} className="request-card">
                <div>
                  <strong>
                    {request.nombre_paciente} · {request.grupo_sanguineo}
                  </strong>
                  <p>
                    {request.hospital} · {request.ciudad}
                  </p>
                  <p>
                    {request.cantidad_donantes} donante(s) ·{' '}
                    {request.fecha_necesidad || 'Sin fecha'}
                  </p>
                </div>
                <button
                  className="btn-primary"
                  type="button"
                  disabled={loading || !user.donante_id}
                  onClick={() => handleOffer(request.id)}
                >
                  Ofrecer donación
                </button>
              </article>
            ))
          )}
        </div>

        {error ? <p className="form-error">{error}</p> : null}
        {message ? <p className="form-ok">{message}</p> : null}
      </div>
    </main>
  )
}

export default Donate
