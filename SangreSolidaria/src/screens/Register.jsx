import { useState } from 'react'

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

function Register({ onNavigate }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    bloodType: 'O+',
    role: 'donante',
  })
  const [message, setMessage] = useState('')

  function handleChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    setMessage(
      `Cuenta creada para ${form.name}. Ya podés ${
        form.role === 'donante' ? 'hacer una donación' : 'pedir donantes'
      }.`
    )
  }

  return (
    <main className="page">
      <div className="page-card">
        <span className="tag">Sumate a la red</span>
        <h1>Registrarse</h1>
        <p>
          Creá tu perfil para donar sangre o publicar una
          solicitud de donantes.
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
            Grupo sanguíneo
            <select
              name="bloodType"
              value={form.bloodType}
              onChange={handleChange}
            >
              {BLOOD_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>

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

          <button className="btn-primary" type="submit">
            Crear cuenta
          </button>
        </form>

        {message ? (
          <div className="form-ok">
            <p>{message}</p>
            <button
              className="btn-secondary"
              type="button"
              onClick={() =>
                onNavigate(form.role === 'donante' ? 'donar' : 'solicitar')
              }
            >
              Continuar
            </button>
          </div>
        ) : null}

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
