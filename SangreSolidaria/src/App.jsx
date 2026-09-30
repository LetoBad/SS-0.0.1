import { useEffect, useState } from 'react'
import './App.css'
import Home from './screens/Home.jsx'
import Login from './screens/Login.jsx'
import Register from './screens/Register.jsx'
import Donate from './screens/Donate.jsx'
import NeedDonors from './screens/NeedDonors.jsx'
import About from './screens/About.jsx'
import Alerts from './screens/Alerts.jsx'
import Profile from './screens/Profile.jsx'
import CompleteProfile from './screens/CompleteProfile.jsx'
import Chats from './screens/Chats.jsx'
import ChatThread from './screens/ChatThread.jsx'
import { useAuth } from './context/AuthContext.jsx'
import { countUnreadAlerts, countUnreadChatMessages } from './lib/db.js'

function profileIsIncomplete(user) {
  return Boolean(user && (user.latitud == null || user.longitud == null))
}

function App() {
  const [screen, setScreen] = useState('inicio')
  const [unreadAlerts, setUnreadAlerts] = useState(0)
  const [unreadChats, setUnreadChats] = useState(0)
  const [activeChatId, setActiveChatId] = useState(null)
  const { user, logout } = useAuth()
  const needsProfile = profileIsIncomplete(user)

  useEffect(() => {
    if (needsProfile && screen !== 'completar' && screen !== 'registro' && screen !== 'login') {
      setScreen('completar')
    }
  }, [needsProfile, screen])

  useEffect(() => {
    if (!user?.id) {
      setUnreadAlerts(0)
      setUnreadChats(0)
      return
    }

    let cancelled = false

    async function loadUnread() {
      try {
        const [alertsCount, chatsCount] = await Promise.all([
          countUnreadAlerts(user.id),
          countUnreadChatMessages(user.id).catch(() => 0),
        ])
        if (!cancelled) {
          setUnreadAlerts(alertsCount)
          setUnreadChats(chatsCount)
        }
      } catch {
        if (!cancelled) setUnreadAlerts(0)
      }
    }

    loadUnread()
    const timer = window.setInterval(loadUnread, 12000)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [user?.id, screen])

  function openChat(conversationId) {
    setActiveChatId(conversationId)
    setScreen('chat')
  }

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
          {user ? (
            <>
              <span className="nav-user">Hola, {user.nombre}</span>
              <button
                className="btn-login"
                onClick={() => setScreen('perfil')}
              >
                Perfil
              </button>
              <button
                className="btn-login btn-alerts"
                onClick={() => setScreen('chats')}
              >
                Chat
                {unreadChats > 0 ? (
                  <span className="alerts-badge">
                    {unreadChats > 9 ? '9+' : unreadChats}
                  </span>
                ) : null}
              </button>
              <button
                className="btn-login btn-alerts"
                onClick={() => setScreen('alertas')}
              >
                Alertas
                {unreadAlerts > 0 ? (
                  <span className="alerts-badge">
                    {unreadAlerts > 9 ? '9+' : unreadAlerts}
                  </span>
                ) : null}
              </button>
              <button
                className="btn-login"
                onClick={() => {
                  logout()
                  setScreen('inicio')
                }}
              >
                Cerrar sesión
              </button>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      </header>

      {screen === 'inicio' ? <Home onNavigate={setScreen} /> : null}
      {screen === 'login' ? <Login onNavigate={setScreen} /> : null}
      {screen === 'registro' ? <Register onNavigate={setScreen} /> : null}
      {screen === 'completar' ? <CompleteProfile onNavigate={setScreen} /> : null}
      {screen === 'donar' ? (
        <Donate onNavigate={setScreen} onOpenChat={openChat} />
      ) : null}
      {screen === 'solicitar' ? <NeedDonors onNavigate={setScreen} /> : null}
      {screen === 'alertas' ? (
        <Alerts onNavigate={setScreen} onOpenChat={openChat} />
      ) : null}
      {screen === 'chats' ? (
        <Chats onNavigate={setScreen} onOpenChat={openChat} />
      ) : null}
      {screen === 'chat' ? (
        <ChatThread conversationId={activeChatId} onNavigate={setScreen} />
      ) : null}
      {screen === 'perfil' ? <Profile onNavigate={setScreen} /> : null}
      {screen === 'sobre' ? <About onNavigate={setScreen} /> : null}

      <footer>
        <p>© 2026 SangreSolidaria · Unimos vidas con solidaridad</p>
      </footer>
    </div>
  )
}

export default App
