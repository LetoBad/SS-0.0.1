function Home({ onNavigate }) {
  return (
    <main>
      <section className="hero" id="inicio">
        <div className="hero-content">
          <span className="tag">♥ Donar sangre salva vidas</span>

          <h1>
            Una donación puede
            <span> cambiar una vida.</span>
          </h1>

          <p>
            Conectamos personas que necesitan sangre con
            donantes solidarios. Tu ayuda puede hacer la
            diferencia.
          </p>

          <div className="hero-buttons">
            <button
              className="btn-primary"
              onClick={() => onNavigate('donar')}
            >
              Hacer una donación
            </button>

            <button
              className="btn-secondary"
              onClick={() => onNavigate('solicitar')}
            >
              Necesito donantes
            </button>
          </div>

          <div className="hero-note">
            <span>♥</span>
            Juntos podemos ayudar a más personas.
          </div>
        </div>

        <div className="hero-image">
          <div className="image-circle">
            <div className="blood-drop">♥</div>
          </div>

          <div className="floating-card">
            <span className="card-heart">♥</span>
            <div>
              <strong>Un gesto solidario</strong>
              <p>Puede salvar una vida</p>
            </div>
          </div>
        </div>
      </section>

      <section className="how" id="como-funciona">
        <span className="section-tag">SANGRESOLIDARIA</span>
        <h2>Ayudar es más fácil de lo que pensás</h2>
        <p className="section-description">
          Tres simples pasos para conectar solidaridad con
          quienes más lo necesitan.
        </p>

        <div className="steps">
          <button
            className="step-card step-card-btn"
            onClick={() => onNavigate('registro')}
          >
            <div className="step-icon">01</div>
            <h3>Registrate</h3>
            <p>
              Creá tu perfil y contanos si querés donar
              sangre o necesitás ayuda.
            </p>
          </button>

          <button
            className="step-card step-card-btn"
            onClick={() => onNavigate('solicitar')}
          >
            <div className="step-icon">02</div>
            <h3>Encontrá ayuda</h3>
            <p>
              Consultá solicitudes y encontrá personas que
              puedan ayudarte.
            </p>
          </button>

          <button
            className="step-card step-card-btn"
            onClick={() => onNavigate('donar')}
          >
            <div className="step-icon">03</div>
            <h3>Hacé la diferencia</h3>
            <p>
              Contactate y coordiná los siguientes pasos
              con el centro de salud.
            </p>
          </button>
        </div>
      </section>

      <section className="callout" id="sobre">
        <h2>La solidaridad nos une.</h2>
        <p>
          Cada persona puede ser parte del cambio. Sumate a
          SangreSolidaria.
        </p>
        <button
          className="btn-light"
          onClick={() => onNavigate('sobre')}
        >
          Conocé más
        </button>
      </section>
    </main>
  )
}

export default Home
