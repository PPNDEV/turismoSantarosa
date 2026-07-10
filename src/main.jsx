import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import App from './App.jsx'

const PRELOAD_RELOAD_KEY = 'vite-preload-reload'

window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault()

  if (window.sessionStorage.getItem(PRELOAD_RELOAD_KEY) === '1') return

  window.sessionStorage.setItem(PRELOAD_RELOAD_KEY, '1')
  window.location.reload()
})

window.setTimeout(() => {
  window.sessionStorage.removeItem(PRELOAD_RELOAD_KEY)
}, 10_000)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
