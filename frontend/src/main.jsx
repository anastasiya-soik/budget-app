import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as Sentry from '@sentry/react'
import App from './App'
import './index.css'
import './i18n/index.js'

if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: 0.2,
  })
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

const ErrorFallback = () => (
  <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '24px' }}>
    <div style={{ fontSize: '32px' }}>🐱</div>
    <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Что-то пошло не так</p>
    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, textAlign: 'center' }}>Попробуй перезагрузить приложение</p>
    <button
      onClick={() => window.location.reload()}
      style={{ marginTop: '8px', padding: '10px 20px', borderRadius: '10px', background: 'var(--amaranth-btn)', color: 'white', border: 'none', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
    >
      Перезагрузить
    </button>
  </div>
)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Sentry.ErrorBoundary fallback={<ErrorFallback />}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </Sentry.ErrorBoundary>
  </React.StrictMode>
)
