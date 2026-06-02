import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css' // <-- ESSA LINHA PRECISA ESTAR AQUI

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)