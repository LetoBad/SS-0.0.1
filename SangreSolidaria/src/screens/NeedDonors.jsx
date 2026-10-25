import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import LocationPicker from '../components/LocationPicker.jsx'
import {
  closeBloodRequest,
  createBloodRequest,
  listMyRequests,
  markDonationFulfilled,
} from '../lib/db.js'
import { BLOOD_TYPES } from '../lib/catalog.js'
import { formatDateInput, formatIsoDate, parseCalendarDate } from '../lib/dates.js'
import { COUNTRIES } from '../lib/geo.js'
import { countryCodeFromCoords } from '../lib/maps.js'

function NeedDonors({ onNavigate }) {
  const { user } = useAuth()
  const [form, setForm] = useState({
    patient: user?.nombre || '',
    bloodType: user?.grupo || '',
    hospital: '',
    city: user?.ciudad || '',
    donorsNeeded: 1,
    neededDate: '',
    details: user?.telefono ? `Contacto: ${user.telefono}` : '',
  })
  const [coords, setCoords] = useState({
    lat: user?.latitud ?? null,
    lng: user?.longitud ?? null,
    label: user?.ciudad || '',
    country: user?.pais || '',
  })
  const [countryPending, setCountryPending] = useState(
    !user?.pais && user?.latitud != null && user?.longitud != null
  )
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [myRequests, setMyRequests] = useState([])
  const [requestsError, setRequestsError] = useState('')
  const [busyAction, setBusyAction] = useState('')

  const REQUEST_LABEL = {
    ACTIVA: 'Buscando donantes',
    EN_PROCESO: 'Con ofertas',
    COMPLETADA: 'Ya hubo ayuda',
    CANCELADA: 'Cancelada',
  }
  const OFFER_LABEL = {
    registrada: 'Oferta registrada',
    confirmada: 'Confirmada',
    realizada: 'Se realizó',
    cancelada: 'Cancelada',
  }

  async function loadMyRequests() {
    if (!user?.id) return
    try {
      const rows = await listMyRequests(user.id)
      setMyRequests(rows)
      setRequestsError('')
    } catch (err) {
      setRequestsError(err.message)
    }
  }

  useEffect(() => {
    loadMyRequests()
  }, [user?.id])

  useEffect(() => {
    if (!user) return
    setForm((current) => ({
      ...current,
      patient: current.patient || user.nombre || '',
      bloodType: current.bloodType || user.grupo || '',
      city: current.city || user.ciudad || '',
      details:
        current.details || (user.telefono ? `Contacto: ${user.telefono}` : ''),
    }))
    setCoords((current) => ({
      lat: current.lat ?? user.latitud ?? null,
      lng: current.lng ?? user.longitud ?? null,
      label: current.label || user.ciudad || '',
      country: current.country || user.pais || '',
    }))
  }, [user])

  useEffect(() => {
    if (!user?.pais) return
    setCountryPending(false)
    setCoords((current) =>
      current.country === user.pais ? current : { ...current, country: user.pais }
    )
  }, [user?.pais])

  useEffect(() => {
    if (coords.country || coords.lat == null || coords.lng == null) {
      setCountryPending(false)
      return
    }

    let cancelled = false
    setCountryPending(true)

    countryCodeFromCoords(coords.lat, coords.lng)
      .then((code) => {
        if (cancelled || !code) return
        const known = COUNTRIES.some((item) => item.code === code)
        if (!known) return
        setCoords((current) =>
          current.country ? current : { ...current, country: code }
        )
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setCountryPending(false)
      })

    return () => {
      cancelled = true
    }
  }, [coords.country, coords.lat, coords.lng])

  function handleChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setMessage('')

    if (coords.lat == null || coords.lng == null) {
      setError('Usá tu ubicación actual para que el sistema pueda avisar a donantes cercanos.')
      return
    }

    let neededDate = ''
    if (form.neededDate.trim()) {
      neededDate = parseCalendarDate(form.neededDate)
      if (!neededDate) {
        setError('Ingresá la fecha de necesidad como dd/mm/aaaa.')
        return
      }
    }

    setLoading(true)

    try {
      const result = await createBloodRequest({
        usuarioId: user.id,
        ...form,
        neededDate,
        latitud: coords.lat,
        longitud: coords.lng,
      })
      setMessage(
        `Solicitud publicada para ${form.patient} (${form.bloodType}) en ${form.hospital}. Se alertó a ${result.alerted} donante(s) compatible(s) dentro de su radio.`
      )
      await loadMyRequests()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleClose(request, outcome) {
    const question =
      outcome === 'ayuda'
        ? '¿Marcás que ya hubo ayuda? El pedido deja de buscar donantes y las ofertas abiertas pasan a realizadas.'
        : '¿Cancelás este pedido? Deja de aparecer para los donantes y las ofertas que no se realizaron quedan canceladas.'
    if (!window.confirm(question)) return

    setError('')
    setMessage('')
    setBusyAction(`${request.id}:${outcome}`)
    try {
      await closeBloodRequest({
        requestId: request.id,
        usuarioId: user.id,
        outcome,
      })
      setMessage(
        outcome === 'ayuda'
          ? 'Pedido cerrado. Ya no aparece para los donantes.'
          : 'Pedido cancelado. Ya no aparece para los donantes.'
      )
      await loadMyRequests()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyAction('')
    }
  }

  async function handleFulfill(request, offer) {
    if (!window.confirm('¿Marcás esta donación como realizada?')) return

    setError('')
    setMessage('')
    setBusyAction(`${request.id}:oferta:${offer.id}`)
    try {
      await markDonationFulfilled({
        donationId: offer.id,
        requestId: request.id,
        usuarioId: user.id,
      })
      setMessage('La donación quedó marcada como realizada.')
      await loadMyRequests()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyAction('')
    }
  }

  if (!user) {
    return (
      <main className="page">
        <div className="page-card">
          <span className="tag">Pedí ayuda</span>
          <h1>Necesito donantes</h1>
          <p>Para publicar una solicitud, primero iniciá sesión o registrate.</p>
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
        <span className="tag">Pedí ayuda</span>
        <h1>Necesito donantes</h1>
        <p>
          Completamos el formulario con tus datos de
          registro. Podés cambiarlos si hace falta.
        </p>

        <h2>Tus pedidos</h2>
        <p className="muted">
          Cuando ya hubo ayuda, o si el pedido ya no hace falta, cerralo.
          Así deja de aparecer en la lista y en el mapa de los donantes.
        </p>
        {requestsError ? <p className="form-error">{requestsError}</p> : null}
        <div className="request-list">
          {myRequests.length === 0 ? (
            <p className="muted">Todavía no publicaste pedidos.</p>
          ) : (
            myRequests.map((request) => {
              const open = request.estado === 'ACTIVA' || request.estado === 'EN_PROCESO'
              const doneCount = request.ofertas.filter((offer) => offer.estado === 'realizada').length
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
                      {REQUEST_LABEL[request.estado] || request.estado}
                      {' · '}
                      {doneCount} de {request.cantidad_donantes} realizada(s)
                      {' · '}
                      {formatIsoDate(request.fecha_necesidad) || 'Sin fecha'}
                    </p>
                    {request.ofertas.length === 0 ? (
                      <p>Todavía no hay ofertas.</p>
                    ) : (
                      request.ofertas.map((offer) => (
                        <p key={offer.id}>
                          {offer.nombre} · {OFFER_LABEL[offer.estado] || offer.estado}
                          {open && (offer.estado === 'registrada' || offer.estado === 'confirmada') ? (
                            <>
                              {' '}
                              <button
                                className="link-button"
                                type="button"
                                disabled={Boolean(busyAction)}
                                onClick={() => handleFulfill(request, offer)}
                              >
                                Se realizó
                              </button>
                            </>
                          ) : null}
                        </p>
                      ))
                    )}
                  </div>
                  {open ? (
                    <div className="request-actions">
                      <button
                        className="btn-primary"
                        type="button"
                        disabled={Boolean(busyAction)}
                        onClick={() => handleClose(request, 'ayuda')}
                      >
                        {busyAction === `${request.id}:ayuda` ? 'Cerrando...' : 'Ya hubo ayuda'}
                      </button>
                      <button
                        className="btn-secondary"
                        type="button"
                        disabled={Boolean(busyAction)}
                        onClick={() => handleClose(request, 'cancelada')}
                      >
                        {busyAction === `${request.id}:cancelada` ? 'Cancelando...' : 'Cancelar pedido'}
                      </button>
                    </div>
                  ) : null}
                </article>
              )
            })
          )}
        </div>

        <form className="form" onSubmit={handleSubmit}>
          <label>
            Nombre del paciente
            <input
              type="text"
              name="patient"
              value={form.patient}
              onChange={handleChange}
              placeholder="Nombre y apellido"
              required
            />
          </label>

          <label>
            Grupo sanguíneo necesario
            <select
              name="bloodType"
              value={form.bloodType}
              onChange={handleChange}
              required
            >
              <option value="" disabled>
                Elegí el grupo
              </option>
              {BLOOD_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>

          <label>
            Hospital o centro de salud
            <input
              type="text"
              name="hospital"
              value={form.hospital}
              onChange={handleChange}
              placeholder="Nombre del centro"
              required
            />
          </label>

          <label>
            Ciudad
            <input
              type="text"
              name="city"
              value={form.city}
              onChange={handleChange}
              placeholder="Ej: Córdoba"
              required
            />
          </label>

          <LocationPicker
            value={coords}
            presetCountry
            countryPending={countryPending}
            onChange={(place) => {
              setCoords(place)
              if (place.label) {
                setForm((current) => ({ ...current, city: place.label }))
              }
            }}
          />

          <label>
            Cantidad de donantes
            <input
              type="number"
              name="donorsNeeded"
              min="1"
              value={form.donorsNeeded}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Fecha de necesidad
            <input
              type="text"
              name="neededDate"
              value={form.neededDate}
              onChange={(event) => {
                const value = formatDateInput(event.target.value)
                setForm((current) => ({ ...current, neededDate: value }))
              }}
              placeholder="dd/mm/aaaa"
              inputMode="numeric"
              maxLength={10}
              pattern="\d{2}/\d{2}/\d{4}"
              title="Usá el formato dd/mm/aaaa"
            />
          </label>
          <p className="muted">
            Escribila como dd/mm/aaaa. Si no hay una fecha fija, podés dejarla vacía.
          </p>

          <label>
            Detalles
            <textarea
              name="details"
              value={form.details}
              onChange={handleChange}
              placeholder="Contacto, horarios, indicaciones..."
              rows={4}
            />
          </label>

          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'Publicando...' : 'Publicar solicitud'}
          </button>
        </form>

        {error ? <p className="form-error">{error}</p> : null}
        {message ? <p className="form-ok">{message}</p> : null}
      </div>
    </main>
  )
}

export default NeedDonors
