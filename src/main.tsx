import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { SalesDataProvider } from './context/SalesDataContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SalesDataProvider>
      <App />
    </SalesDataProvider>
  </StrictMode>,
)
