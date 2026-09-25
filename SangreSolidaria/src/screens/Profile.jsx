import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import LocationPicker from '../components/LocationPicker.jsx'
import { refreshSessionUser, saveDonorLocation } from '../lib/db.js'

function Profile({ onNavigate }) {
  const { user, setUser } = useAuth()
  const [coords, setCoords] = useState({
    lat: user?.latitud ?? null,
    lng: user?.longitud ?? null,
    label: user?.ciudad || '',
  })
  const [radiusKm, setRadiusKm] = useState(user?.radio_km || 5)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (!user) {
    return (
      <main className="page">
        <div className="page-card">
          <h1>Perfil</h1>
          <p>Iniciá sesión para configurar tu ubicación y tu radio.</p>
          <button className="btn-primary" onClick={() => onNavigate('login')}>
            Iniciar sesión
          </button>
        </div>
      </main>
    )
  }

  async function handleSave() {
    setError('')
    setMessage('')

    if (!user.donante_id) {
      setError('El radio de desplazamiento está disponible para cuentas de donante.')
      return
    }

    if (coords.lat == null || coords.lng == null) {
      setError('Buscá un lugar o usá el GPS antes de guardar.')
      return
    }

    setLoading(true)

    try {
      await saveDonorLocation({
        donorId: user.donante_id,
        userId: user.id,
        latitud: coords.lat,
        longitud: coords.lng,
        radioKm,
        ciudad: coords.label || user.ciudad,
      })
      const refreshed = await refreshSessionUser(user.id)
      setUser(refreshed)
      setMessage('Perfil actualizado. Las alertas usarán este radio y esta ubicación.')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="page">
      <div className="page-card">
        <span className="tag">Tu cuenta</span>
        <h1>Perfil</h1>
        <p>
          {user.nombre} · {user.email}
          {user.grupo ? ` · Grupo ${user.grupo}` : ''}
        </p>

        {user.donante_id ? (
          <div className="form">
            <h3>Ubicación y radio de desplazamiento</h3>
            <p className="muted">
              Solo vas a recibir alertas de solicitudes
              compatibles que estén dentro de este radio.
            </p>

            <LocationPicker value={coords} onChange={setCoords} />

            <label>
              Radio máximo (km)
              <input
                type="number"
                min="1"
                max="200"
                step="0.5"
                value={radiusKm}
                onChange={(event) => setRadiusKm(event.target.value)}
              />
            </label>

            <button
              className="btn-primary"
              type="button"
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? 'Guardando...' : 'Guardar perfil'}
            </button>
          </div>
        ) : (
          <p className="muted">
            El radio de alertas se configura en cuentas de
            donante.
          </p>
        )}

        {error ? <p className="form-error">{error}</p> : null}
        {message ? <p className="form-ok">{message}</p> : null}
      </div>
    </main>
  )
}

export default Profile
