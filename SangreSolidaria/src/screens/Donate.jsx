import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import DonorsMap from '../components/DonorsMap.jsx'
import {
  listActiveRequests,
  listMyConversations,
  offerDonation,
} from '../lib/db.js'
import { canDonateTo } from '../lib/catalog.js'
import { formatDateInput, formatIsoDate, parseCalendarDate } from '../lib/dates.js'
import { distanceKm, formatKm, isWithinRadius } from '../lib/geo.js'

function Donate({ onNavigate, onOpenChat }) {
  const { user } = useAuth()
  const [requests, setRequests] = useState([])
  const [dateFilter, setDateFilter] = useState('')
  const [focusCoords, setFocusCoords] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [openedChatId, setOpenedChatId] = useState(null)
  const [chatsByRequest, setChatsByRequest] = useState({})

  useEffect(() => {
    listActiveRequests()
      .then(setRequests)
      .catch((err) => setError(err.message))

    if (user?.id) {
      listMyConversations(user.id)
        .then((chats) => {
          const map = {}
          chats.forEach((chat) => {
            map[chat.solicitud_id] = chat.id
          })
          setChatsByRequest(map)
        })
        .catch(() => setChatsByRequest({}))
    }
  }, [user?.id])

  async function handleOffer(request) {
    if (!user?.donante_id || !user?.grupo) {
      setError('Cargá tu grupo sanguíneo en el perfil para poder ofrecer sangre.')
      return
    }

    if (String(request.usuario_id) === String(user.id)) {
      setError('Esta solicitud es tuya. No podés ofrecerte como donante de tu propio pedido.')
      return
    }

    if (!canDonateTo(user.grupo, request.grupo_sanguineo)) {
      setError('Tu grupo no es compatible con este pedido.')
      return
    }

    setError('')
    setMessage('')
    setLoading(true)

    try {
      const donation = await offerDonation({
        donorId: user.donante_id,
        requestId: request.id,
      })
      if (request.latitud != null && request.longitud != null) {
        setFocusCoords({ lat: request.latitud, lng: request.longitud })
      }
      setOpenedChatId(donation.conversationId || null)
      if (donation.conversationId) {
        setChatsByRequest((current) => ({
          ...current,
          [request.id]: donation.conversationId,
        }))
      }
      setMessage(
        donation.alreadyOffered
          ? 'Ya habías ofrecido donar para esta solicitud. El chat sigue disponible.'
          : 'Donación registrada. Se desbloqueó el chat con el receptor.'
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
          <p>Para ofrecer una donación, primero iniciá sesión o registrate.</p>
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
  const compatibleRequests = user.grupo
    ? requests.filter(
        (request) =>
          String(request.usuario_id) !== String(user.id) &&
          canDonateTo(user.grupo, request.grupo_sanguineo)
      )
    : []
  const filterIso = parseCalendarDate(dateFilter)
  const dateFilterInvalid = dateFilter.length === 10 && !filterIso
  const visibleRequests =
    filterIso == null
      ? compatibleRequests
      : compatibleRequests.filter(
          (request) => String(request.fecha_necesidad || '').slice(0, 10) === filterIso
        )

  return (
    <main className="page">
      <div className="page-card page-wide">
        <span className="tag">Salvá una vida</span>
        <h1>Hacer una donación</h1>
        <p>
          Ves solo los pedidos compatibles con tu grupo.
          El radio y la ubicación se configuran en el perfil.
        </p>

        {!user.grupo ? (
          <p className="form-error">
            Cargá tu grupo sanguíneo en el perfil para ver
            pedidos compatibles y poder ofrecer sangre.
          </p>
        ) : (
          <p className="muted">
            Grupo {user.grupo}. Radio actual: {user.radio_km || 5} km.{' '}
            <button type="button" className="link-button" onClick={() => onNavigate('perfil')}>
              Cambiar en mi perfil
            </button>
          </p>
        )}

        <div className="map-legend">
          <span>
            <i className="dot dot-request" /> Solicitudes compatibles
          </span>
        </div>

        <DonorsMap requests={visibleRequests} focusCoords={focusCoords} />

        <form className="form" onSubmit={(event) => event.preventDefault()}>
          <label>
            Filtrar por fecha
            <input
              type="text"
              value={dateFilter}
              onChange={(event) => setDateFilter(formatDateInput(event.target.value))}
              placeholder="dd/mm/aaaa"
              inputMode="numeric"
              maxLength={10}
              pattern="\d{2}/\d{2}/\d{4}"
              title="Usá el formato dd/mm/aaaa"
            />
          </label>
          <p className="muted">
            Mostrá los pedidos que necesitan donantes ese día. Dejala vacía para ver todos.
          </p>
          {dateFilterInvalid ? (
            <p className="form-error">Ingresá la fecha como dd/mm/aaaa.</p>
          ) : null}
        </form>

        <div className="request-list">
          {!user.grupo ? null : visibleRequests.length === 0 ? (
            <p className="muted">
              {filterIso
                ? `No hay solicitudes compatibles para el ${dateFilter}.`
                : 'No hay solicitudes compatibles con tu grupo por ahora.'}
            </p>
          ) : (
            visibleRequests.map((request) => {
              const requestPoint =
                request.latitud != null && request.longitud != null
                  ? { lat: Number(request.latitud), lng: Number(request.longitud) }
                  : null
              const km = donorPoint && requestPoint
                ? distanceKm(donorPoint, requestPoint)
                : null
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
                      {formatIsoDate(request.fecha_necesidad) || 'Sin fecha'}
                    </p>
                    <p>
                      Distancia: {formatKm(km)}
                      {inside ? ' · Dentro de tu radio' : ''}
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
                    {chatsByRequest[request.id] ? (
                      <button
                        className="btn-secondary"
                        type="button"
                        onClick={() => onOpenChat(chatsByRequest[request.id])}
                      >
                        Abrir chat
                      </button>
                    ) : null}
                  </div>
                </article>
              )
            })
          )}
        </div>

        {error ? <p className="form-error">{error}</p> : null}
        {message ? (
          <p className="form-ok">
            {message}
            {openedChatId ? (
              <>
                {' '}
                <button
                  className="btn-secondary"
                  type="button"
                  onClick={() => onOpenChat(openedChatId)}
                >
                  Abrir chat
                </button>
              </>
            ) : null}
          </p>
        ) : null}
      </div>
    </main>
  )
}

export default Donate
