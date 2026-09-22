function About({ onNavigate }) {
  return (
    <main className="page">
      <div className="page-card page-wide">
        <span className="tag">Nuestra misión</span>
        <h1>Sobre SangreSolidaria</h1>
        <p>
          Somos una red que une a quienes pueden donar
          sangre con quienes más lo necesitan. El objetivo
          es acortar tiempos, acercar información y
          facilitar el contacto con centros de salud.
        </p>

        <div className="about-grid">
          <article>
            <h3>Donantes</h3>
            <p>
              Registrá tu grupo sanguíneo y disponibilidad
              para que las solicitudes lleguen a las
              personas correctas.
            </p>
          </article>
          <article>
            <h3>Familias</h3>
            <p>
              Publicá una necesidad concreta: hospital,
              ciudad y urgencia. La comunidad puede
              responder más rápido.
            </p>
          </article>
          <article>
            <h3>Centros de salud</h3>
            <p>
              La donación siempre se concreta en un centro
              habilitado. Nosotros conectamos; ellos
              acompañan el proceso clínico.
            </p>
          </article>
        </div>

        <div className="hero-buttons">
          <button
            className="btn-primary"
            onClick={() => onNavigate('registro')}
          >
            Quiero registrarme
          </button>
          <button
            className="btn-secondary"
            onClick={() => onNavigate('donar')}
          >
            Hacer una donación
          </button>
        </div>
      </div>
    </main>
  )
}

export default About
