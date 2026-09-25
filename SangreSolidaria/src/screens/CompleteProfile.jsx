import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import LocationPicker from '../components/LocationPicker.jsx'
import { completeUserProfile } from '../lib/db.js'

function CompleteProfile({ onNavigate }) {
  const { user, setUser } = useAuth()
  const [phone, setPhone] = useState(user?.telefono || '')
  const [radiusKm, setRadiusKm] = useState(user?.radio_km || 5)
  const [coords, setCoords] = useState({
    lat: user?.latitud ?? null,
    lng: user?.longitud ?? null,
    label: user?.ciudad || '',
    country: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (!user) {
    return (
      <main className="page">
        <div className="page-card">
          <h1>Completar datos</h1>
          <p>Primero registrate o iniciá sesión.</p>
          <button className="btn-primary" onClick={() => onNavigate('registro')}>
            Registrarse
          </button>
        </div>
      </main>
    )
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (!coords.country && coords.lat == null) {
      setError('Elegí el país y tu localidad.')
      return
    }

    if (coords.lat == null || coords.lng == null) {
      setError('Buscá y seleccioná tu localidad, o usá el GPS.')
      return
    }

    setLoading(true)

    try {
      const updated = await completeUserProfile({
        userId: user.id,
        donorId: user.donante_id,
        phone,
        city: coords.label || user.ciudad,
        latitud: coords.lat,
        longitud: coords.lng,
        radioKm,
      })
      setUser(updated)
      onNavigate(user.donante_id ? 'donar' : 'solicitar')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="page">
      <div className="page-card">
        <span className="tag">Paso obligatorio</span>
        <h1>Completá tus datos</h1>
        <p>
          Hola, {user.nombre}. Antes de continuar necesitamos
          tu país y localidad. Esos datos se van a usar en
          las solicitudes y en las alertas.
        </p>

        <form className="form" onSubmit={handleSubmit}>
          <label>
            Teléfono
            <input
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="Opcional"
            />
          </label>

          <LocationPicker value={coords} onChange={setCoords} />

          {user.donante_id ? (
            <label>
              Radio máximo de desplazamiento (km)
              <input
                type="number"
                min="1"
                max="200"
                step="0.5"
                value={radiusKm}
                onChange={(event) => setRadiusKm(event.target.value)}
              />
            </label>
          ) : null}

          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar y continuar'}
          </button>
        </form>

        {error ? <p className="form-error">{error}</p> : null}
      </div>
    </main>
  )
}

export default CompleteProfile
