import { useState } from 'react'
import './App.css'
import Home from './screens/Home.jsx'
import Login from './screens/Login.jsx'
import Register from './screens/Register.jsx'
import Donate from './screens/Donate.jsx'
import NeedDonors from './screens/NeedDonors.jsx'
import About from './screens/About.jsx'

function App() {
  const [screen, setScreen] = useState('inicio')

  function goHomeAndScroll(sectionId) {
    setScreen('inicio')
    window.setTimeout(() => {
      document.getElementById(sectionId)?.scrollIntoView({
        behavior: 'smooth',
      })
    }, 0)
  }

  return (
    <div className="app">
      <header className="navbar">
        <button className="logo" onClick={() => setScreen('inicio')}>
          <span className="logo-icon">♥</span>
          SangreSolidaria
        </button>

        <nav className="menu">
          <button type="button" onClick={() => goHomeAndScroll('inicio')}>
            Inicio
          </button>
          <button
            type="button"
            onClick={() => goHomeAndScroll('como-funciona')}
          >
            Cómo funciona
          </button>
          <button type="button" onClick={() => setScreen('sobre')}>
            Sobre nosotros
          </button>
        </nav>

        <div className="nav-actions">
          <button
            className="btn-login"
            onClick={() => setScreen('login')}
          >
            Iniciar sesión
          </button>
          <button
            className="btn-primary"
            onClick={() => setScreen('registro')}
          >
            Registrarse
          </button>
        </div>
      </header>

      {screen === 'inicio' ? <Home onNavigate={setScreen} /> : null}
      {screen === 'login' ? <Login onNavigate={setScreen} /> : null}
      {screen === 'registro' ? <Register onNavigate={setScreen} /> : null}
      {screen === 'donar' ? <Donate /> : null}
      {screen === 'solicitar' ? <NeedDonors /> : null}
      {screen === 'sobre' ? <About onNavigate={setScreen} /> : null}

      <footer>
        <p>© 2026 SangreSolidaria · Unimos vidas con solidaridad</p>
      </footer>
    </div>
  )
}

export default App
