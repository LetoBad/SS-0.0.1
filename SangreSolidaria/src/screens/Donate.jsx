import { useState } from 'react'

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

function Donate() {
  const [form, setForm] = useState({
    name: '',
    bloodType: 'O+',
    city: '',
    date: '',
    notes: '',
  })
  const [message, setMessage] = useState('')

  function handleChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    setMessage(
      `Gracias, ${form.name}. Registramos tu intención de donar ${form.bloodType} en ${form.city}.`
    )
  }

  return (
    <main className="page">
      <div className="page-card">
        <span className="tag">Salvá una vida</span>
        <h1>Hacer una donación</h1>
        <p>
          Completá tus datos para ofrecer una donación de
          sangre. Un centro de salud podrá coordinar el
          siguiente paso.
        </p>

        <form className="form" onSubmit={handleSubmit}>
          <label>
            Nombre
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

          <label>
            Ciudad
            <input
              type="text"
              name="city"
              value={form.city}
              onChange={handleChange}
              placeholder="Ej: Buenos Aires"
              required
            />
          </label>

          <label>
            Fecha disponible
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Comentarios
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="Horarios, centro de salud preferido, etc."
              rows={4}
            />
          </label>

          <button className="btn-primary" type="submit">
            Confirmar donación
          </button>
        </form>

        {message ? <p className="form-ok">{message}</p> : null}
      </div>
    </main>
  )
}

export default Donate
