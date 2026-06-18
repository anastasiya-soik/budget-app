import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as Sentry from '@sentry/react'
import App from './App'
import './index.css'
import './i18n/index.js'

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN || 'https://8ee70d0a04fc1d3a553eb99f292469e5@o4511170128969728.ingest.de.sentry.io/4511552705855568'

Sentry.init({
  dsn: SENTRY_DSN,
  integrations: [Sentry.browserTracingIntegration()],
  tracesSampleRate: 0.2,
})

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

const ErrorFallback = ({ error }) => (
  <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '24px' }}>
    <div style={{ fontSize: '32px' }}>🐱</div>
    <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Что-то пошло не так</p>
    {error?.message && (
      <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0, textAlign: 'center', maxWidth: '320px', wordBreak: 'break-all', fontFamily: 'monospace', background: 'rgba(0,0,0,0.04)', borderRadius: '8px', padding: '8px 12px' }}>
        {error.message}
      </p>
    )}
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
    <Sentry.ErrorBoundary fallback={({ error }) => <ErrorFallback error={error} />}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </Sentry.ErrorBoundary>
  </React.StrictMode>
)
