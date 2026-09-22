import { useState } from 'react'

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

function NeedDonors() {
  const [form, setForm] = useState({
    patient: '',
    bloodType: 'O+',
    hospital: '',
    city: '',
    urgency: 'media',
    details: '',
  })
  const [message, setMessage] = useState('')

  function handleChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    setMessage(
      `Solicitud publicada para ${form.patient} (${form.bloodType}) en ${form.hospital}.`
    )
  }

  return (
    <main className="page">
      <div className="page-card">
        <span className="tag">Pedí ayuda</span>
        <h1>Necesito donantes</h1>
        <p>
          Publicá una solicitud para que donantes
          solidarios puedan acercarse al centro de salud.
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
            >
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

          <label>
            Urgencia
            <select
              name="urgency"
              value={form.urgency}
              onChange={handleChange}
            >
              <option value="baja">Baja</option>
              <option value="media">Media</option>
              <option value="alta">Alta</option>
            </select>
          </label>

          <label>
            Detalles
            <textarea
              name="details"
              value={form.details}
              onChange={handleChange}
              placeholder="Cantidad de donantes, contacto, horarios..."
              rows={4}
            />
          </label>

          <button className="btn-primary" type="submit">
            Publicar solicitud
          </button>
        </form>

        {message ? <p className="form-ok">{message}</p> : null}
      </div>
    </main>
  )
}

export default NeedDonors
