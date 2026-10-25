import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import LocationPicker from '../components/LocationPicker.jsx'
import { BLOOD_TYPES } from '../lib/catalog.js'
import { updateAccountProfile } from '../lib/db.js'
import { COUNTRIES } from '../lib/geo.js'
import { countryCodeFromCoords } from '../lib/maps.js'

function Profile({ onNavigate }) {
  const { user, setUser } = useAuth()
  const [coords, setCoords] = useState({
    lat: user?.latitud ?? null,
    lng: user?.longitud ?? null,
    label: user?.ciudad || '',
    country: user?.pais || '',
  })
  const [radiusKm, setRadiusKm] = useState(user?.radio_km || 5)
  const [name, setName] = useState(user?.nombre || '')
  const [phone, setPhone] = useState(user?.telefono || '')
  const [bloodType, setBloodType] = useState(user?.grupo || '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [countryPending, setCountryPending] = useState(
    !user?.pais && user?.latitud != null && user?.longitud != null
  )

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

    if (!name.trim()) {
      setError('El nombre es obligatorio.')
      return
    }

    if (coords.lat == null || coords.lng == null) {
      setError('Buscá y seleccioná un lugar antes de guardar.')
      return
    }

    const passwordTouched = currentPassword || newPassword || confirmPassword
    if (passwordTouched) {
      if (!currentPassword || !newPassword || !confirmPassword) {
        setError('Para cambiar la contraseña completá la actual, la nueva y la repetición.')
        return
      }
      if (newPassword !== confirmPassword) {
        setError('La nueva contraseña y la repetición no coinciden.')
        return
      }
      if (newPassword.length < 8) {
        setError('La nueva contraseña debe tener al menos 8 caracteres.')
        return
      }
    }

    setLoading(true)

    try {
      const refreshed = await updateAccountProfile({
        userId: user.id,
        donorId: user.donante_id,
        name,
        phone,
        bloodType,
        currentPassword: passwordTouched ? currentPassword : '',
        newPassword: passwordTouched ? newPassword : '',
        latitud: coords.lat,
        longitud: coords.lng,
        radioKm: radiusKm,
        ciudad: coords.label || user.ciudad,
        pais: coords.country,
      })
      setUser(refreshed)
      setBloodType(refreshed.grupo || bloodType)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setMessage('Perfil actualizado. Con esta cuenta podés donar y pedir donantes.')
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
          {user.email}. Con esta cuenta podés donar y pedir donantes.
        </p>

        <div className="form">
          <label>
            Nombre completo
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </label>

          <label>
            Teléfono
            <input
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="Tu número de contacto"
            />
          </label>

          <label>
            Grupo sanguíneo
            <select
              value={bloodType}
              onChange={(event) => setBloodType(event.target.value)}
              required={Boolean(user.grupo)}
            >
              <option value="" disabled>
                Elegí tu grupo
              </option>
              {BLOOD_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>

          <h3>Contraseña</h3>
          <p className="muted">Dejala en blanco si no querés cambiarla.</p>
          <label>
            Contraseña actual
            <input
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              autoComplete="current-password"
            />
          </label>
          <label>
            Nueva contraseña
            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              autoComplete="new-password"
              minLength={8}
            />
          </label>
          <label>
            Repetir nueva contraseña
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              minLength={8}
            />
          </label>

          <h3>Ubicación y radio de desplazamiento</h3>
          <p className="muted">
            Solo vas a recibir alertas de solicitudes
            compatibles que estén dentro de este radio.
          </p>

          <LocationPicker
            value={coords}
            onChange={setCoords}
            presetCountry
            countryPending={countryPending}
          />

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

        {error ? <p className="form-error">{error}</p> : null}
        {message ? <p className="form-ok">{message}</p> : null}
      </div>
    </main>
  )
}

export default Profile
