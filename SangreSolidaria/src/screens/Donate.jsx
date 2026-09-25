import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import DonorsMap from '../components/DonorsMap.jsx'
import {
  listActiveRequests,
  listAvailableDonors,
  offerDonation,
} from '../lib/db.js'
import { canDonateTo } from '../lib/catalog.js'
import { distanceKm, formatKm, isWithinRadius } from '../lib/geo.js'

function Donate({ onNavigate }) {
  const { user } = useAuth()
  const [requests, setRequests] = useState([])
  const [donors, setDonors] = useState([])
  const [notes, setNotes] = useState('')
  const [date, setDate] = useState('')
  const [focusCoords, setFocusCoords] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    listActiveRequests()
      .then(setRequests)
      .catch((err) => setError(err.message))

    listAvailableDonors()
      .then(setDonors)
      .catch(() => setDonors([]))
  }, [])

  async function handleOffer(request) {
    if (!user?.donante_id) {
      setError('Necesitás una cuenta de donante para ofrecer sangre.')
      return
    }

    setError('')
    setMessage('')
    setLoading(true)

    try {
      const donation = await offerDonation({
        donorId: user.donante_id,
        requestId: request.id,
        notes,
        date,
      })
      if (request.latitud != null && request.longitud != null) {
        setFocusCoords({ lat: request.latitud, lng: request.longitud })
      }
      setMessage(
        donation.alreadyOffered
          ? 'Ya habías ofrecido donar para esta solicitud. Actualizamos tus datos.'
          : 'Donación registrada. El solicitante podrá verla.'
      )
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

  const donorPoint =
    user.latitud != null && user.longitud != null
      ? { lat: Number(user.latitud), lng: Number(user.longitud) }
      : null
  const radiusKm = user.radio_km || 5

  return (
    <main className="page">
      <div className="page-card page-wide">
        <span className="tag">Salvá una vida</span>
        <h1>Hacer una donación</h1>
        <p>
          Elegí una solicitud activa. Tu radio y ubicación
          se configuran en el perfil.
        </p>

        {!user.donante_id ? (
          <p className="form-error">
            Tu cuenta no tiene perfil de donante. Registrate
            como donante para poder ofrecer sangre.
          </p>
        ) : (
          <p className="muted">
            Radio actual: {user.radio_km || 5} km.{' '}
            <button type="button" className="link-button" onClick={() => onNavigate('perfil')}>
              Cambiar en mi perfil
            </button>
          </p>
        )}

        <div className="map-legend">
          <span>
            <i className="dot dot-donor" /> Donantes disponibles
          </span>
          <span>
            <i className="dot dot-request" /> Solicitudes
          </span>
        </div>

        <DonorsMap
          donors={donors}
          requests={requests}
          focusCoords={focusCoords}
        />

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
            requests.map((request) => {
              const requestPoint =
                request.latitud != null && request.longitud != null
                  ? { lat: Number(request.latitud), lng: Number(request.longitud) }
                  : null
              const km = donorPoint && requestPoint
                ? distanceKm(donorPoint, requestPoint)
                : null
              const compatible = canDonateTo(user.grupo, request.grupo_sanguineo)
              const inside = donorPoint && requestPoint
                ? isWithinRadius(donorPoint, requestPoint, radiusKm)
                : false

              return (
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
                    <p>
                      Distancia: {formatKm(km)}
                      {inside && compatible ? ' · Dentro de tu radio' : ''}
                    </p>
                  </div>
                  <div className="request-actions">
                    <button
                      className="btn-secondary"
                      type="button"
                      onClick={() =>
                        setFocusCoords(
                          requestPoint || null
                        )
                      }
                    >
                      Ver en mapa
                    </button>
                    <button
                      className="btn-primary"
                      type="button"
                      disabled={loading || !user.donante_id}
                      onClick={() => handleOffer(request)}
                    >
                      Ofrecer donación
                    </button>
                  </div>
                </article>
              )
            })
          )}
        </div>

        {error ? <p className="form-error">{error}</p> : null}
        {message ? <p className="form-ok">{message}</p> : null}
      </div>
    </main>
  )
}

export default Donate
