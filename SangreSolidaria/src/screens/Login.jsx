import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'

function Login({ onNavigate }) {
  const { login } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    try {
      const user = await login(form.email, form.password)
      setMessage(`Bienvenido/a, ${user.nombre}.`)
      window.setTimeout(() => onNavigate('inicio'), 800)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="page">
      <div className="page-card">
        <span className="tag">Accedé a tu cuenta</span>
        <h1>Iniciar sesión</h1>
        <p>Ingresá el correo y la contraseña con los que te registraste.</p>

        <form className="form" onSubmit={handleSubmit}>
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
              placeholder="Tu contraseña"
              required
            />
          </label>

          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'Ingresando...' : 'Iniciar sesión'}
          </button>
        </form>

        {error ? <p className="form-error">{error}</p> : null}
        {message ? <p className="form-ok">{message}</p> : null}

        <p className="form-switch">
          ¿Todavía no tenés cuenta?{' '}
          <button type="button" onClick={() => onNavigate('registro')}>
            Registrate
          </button>
        </p>
      </div>
    </main>
  )
}

export default Login
