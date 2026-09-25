import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import LocationPicker from '../components/LocationPicker.jsx'
import { createBloodRequest } from '../lib/db.js'
import { BLOOD_TYPES } from '../lib/catalog.js'

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
  })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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
    }))
  }, [user])

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

    setLoading(true)

    try {
      const result = await createBloodRequest({
        usuarioId: user.id,
        ...form,
        latitud: coords.lat,
        longitud: coords.lng,
      })
      setMessage(
        `Solicitud publicada para ${form.patient} (${form.bloodType}) en ${form.hospital}. Se alertó a ${result.alerted} donante(s) compatible(s) dentro de su radio.`
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
      <div className="page-card">
        <span className="tag">Pedí ayuda</span>
        <h1>Necesito donantes</h1>
        <p>
          Completamos el formulario con tus datos de
          registro. Podés cambiarlos si hace falta.
        </p>

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
              type="date"
              name="neededDate"
              value={form.neededDate}
              onChange={handleChange}
            />
          </label>

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
