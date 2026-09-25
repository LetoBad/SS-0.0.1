import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { BLOOD_TYPES } from '../lib/catalog.js'

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
    role: 'donante',
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

    setLoading(true)

    try {
      await register(form)
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
          Primero creá tu cuenta. En el siguiente paso vas a
          completar país y localidad.
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
            Teléfono
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="Opcional"
            />
          </label>

          <label>
            Fecha de nacimiento
            <input
              type="date"
              name="birthDate"
              value={form.birthDate}
              onChange={handleChange}
            />
          </label>

          {form.role === 'donante' ? (
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
          ) : null}

          <fieldset className="role-options">
            <legend>Quiero</legend>
            <label className="radio">
              <input
                type="radio"
                name="role"
                value="donante"
                checked={form.role === 'donante'}
                onChange={handleChange}
              />
              Ser donante
            </label>
            <label className="radio">
              <input
                type="radio"
                name="role"
                value="solicitante"
                checked={form.role === 'solicitante'}
                onChange={handleChange}
              />
              Pedir donantes
            </label>
          </fieldset>

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
