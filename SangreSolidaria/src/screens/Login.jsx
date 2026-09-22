import { useState } from 'react'

function Login({ onNavigate }) {
  const [form, setForm] = useState({ email: '', password: '' })
  const [message, setMessage] = useState('')

  function handleChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    setMessage(`Bienvenido/a. Sesión iniciada con ${form.email}.`)
  }

  return (
    <main className="page">
      <div className="page-card">
        <span className="tag">Accedé a tu cuenta</span>
        <h1>Iniciar sesión</h1>
        <p>
          Ingresá para gestionar donaciones, solicitudes y
          tu perfil.
        </p>

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
              placeholder="••••••••"
              required
            />
          </label>

          <button className="btn-primary" type="submit">
            Iniciar sesión
          </button>
        </form>

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
