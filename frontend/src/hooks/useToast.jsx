import { createContext, useCallback, useContext, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

const ToastCtx = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const counter = useRef(0)

  const show = useCallback((msg, type = 'success') => {
    const id = ++counter.current
    setToasts(prev => [...prev, { id, msg, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 2600)
  }, [])

  return (
    <ToastCtx.Provider value={show}>
      {children}
      <div style={{ position: 'fixed', bottom: '84px', right: '16px', zIndex: 200, display: 'flex', flexDirection: 'column-reverse', gap: '8px', pointerEvents: 'none' }}>
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 16, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              style={{
                background: t.type === 'error' ? '#E52B50' : '#10b981',
                color: 'white',
                fontSize: '13px',
                fontWeight: 600,
                padding: '10px 16px',
                borderRadius: '12px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
                whiteSpace: 'nowrap',
                userSelect: 'none',
              }}
            >
              {t.type === 'error' ? '✕ ' : '✓ '}{t.msg}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  )
}

export const useToast = () => useContext(ToastCtx)
