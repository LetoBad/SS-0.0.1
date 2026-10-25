import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { BLOOD_TYPES } from '../lib/catalog.js'
import {
  formatDateInput,
  meetsMinimumAge,
  MIN_ACCOUNT_AGE,
  parseBirthDate,
} from '../lib/dates.js'

function Register({ onNavigate }) {
  const { register } = useAuth()
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    birthDate: '',
    password: '',
    passwordConfirm: '',
    bloodType: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (form.password !== form.passwordConfirm) {
      setError('Las contraseñas no coinciden.')
      return
    }

    const birthDate = parseBirthDate(form.birthDate)
    if (!birthDate) {
      setError('Ingresá la fecha de nacimiento como dd/mm/aaaa.')
      return
    }
    if (!meetsMinimumAge(birthDate)) {
      setError(`Para crear una cuenta tenés que tener al menos ${MIN_ACCOUNT_AGE} años.`)
      return
    }

    setLoading(true)

    try {
      await register({ ...form, birthDate })
      onNavigate('completar')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="page">
      <div className="page-card">
        <span className="tag">Sumate a la red</span>
        <h1>Registrarse</h1>
        <p>
          Con la misma cuenta vas a poder donar y pedir
          donantes. En el siguiente paso vas a completar país
          y localidad.
        </p>

        <form className="form" onSubmit={handleSubmit}>
          <label>
            Nombre completo
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Nombre y apellido"
              required
            />
          </label>

          <label>
            Correo electrónico
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="tuemail@ejemplo.com"
              required
            />
          </label>

          <label>
            Contraseña
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Mínimo 8 caracteres"
              minLength={8}
              required
            />
          </label>

          <label>
            Repetir contraseña
            <input
              type="password"
              name="passwordConfirm"
              value={form.passwordConfirm}
              onChange={handleChange}
              placeholder="Repetí la contraseña"
              minLength={8}
              required
            />
          </label>

          <label>
            Fecha de nacimiento
            <input
              type="text"
              name="birthDate"
              value={form.birthDate}
              onChange={(event) => {
                const { name } = event.target
                const value = formatDateInput(event.target.value)
                setForm((current) => ({ ...current, [name]: value }))
              }}
              placeholder="dd/mm/aaaa"
              inputMode="numeric"
              autoComplete="bday"
              maxLength={10}
              pattern="\d{2}/\d{2}/\d{4}"
              title="Usá el formato dd/mm/aaaa"
              required
            />
          </label>
          <p className="muted">
            Tenés que tener al menos {MIN_ACCOUNT_AGE} años.
          </p>

          <label>
            Grupo sanguíneo
            <select
              name="bloodType"
              value={form.bloodType}
              onChange={handleChange}
              required
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

          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>

        {error ? <p className="form-error">{error}</p> : null}

        <p className="form-switch">
          ¿Ya tenés cuenta?{' '}
          <button type="button" onClick={() => onNavigate('login')}>
            Iniciar sesión
          </button>
        </p>
      </div>
    </main>
  )
}

export default Register
