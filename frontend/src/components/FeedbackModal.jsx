import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import feedbackApi from '../api/feedback'
import { apiError } from '../utils'
import { useScrollLock } from '../hooks/useScrollLock'

const FeedbackModal = ({ onClose }) => {
  useScrollLock()
  const { t } = useTranslation()
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const feedbackMutation = useMutation({
    mutationFn: (msg) => feedbackApi.send(msg),
    onSuccess: () => onClose(),
    onError: (err) => setError(apiError(err)),
  })

  const handleSubmit = () => {
    if (!message.trim() || message.length < 3) {
      setError(t('feedback.tooShort'))
      return
    }
    feedbackMutation.mutate(message.trim())
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(13,10,16,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        style={{ background: 'var(--surface)', border: '0.5px solid var(--border-card)', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '400px', boxShadow: '0 8px 40px rgba(0,0,0,0.2)', maxHeight: 'calc(100dvh - 48px)', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginTop: 0, marginBottom: '16px' }}>
          {t('feedback.title')}
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <textarea
            value={message}
            onChange={(e) => { setMessage(e.target.value); setError('') }}
            placeholder={t('feedback.placeholder')}
            style={{ width: '100%', borderRadius: '10px', padding: '10px 14px', fontSize: '14px', border: '1px solid var(--border-card)', background: 'var(--surface)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box', minHeight: '100px', fontFamily: 'inherit', resize: 'none' }}
          />
          {error && <div style={{ background: 'rgba(229,43,80,0.08)', border: '1px solid rgba(229,43,80,0.2)', color: '#E52B50', fontSize: '13px', borderRadius: '10px', padding: '10px 14px' }}>{error}</div>}
          <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
            <motion.div whileTap={{ scale: 0.97 }} onClick={onClose}
              style={{ flex: 1, borderRadius: '10px', padding: '11px', fontSize: '13px', fontWeight: 500, textAlign: 'center', cursor: 'pointer', border: '1px solid var(--border-card)', color: 'var(--text-primary)', background: 'var(--surface)', userSelect: 'none' }}
            >{t('feedback.cancel')}</motion.div>
            <motion.div whileTap={{ scale: 0.97 }}
              onClick={feedbackMutation.isPending ? undefined : handleSubmit}
              style={{ flex: 1, borderRadius: '10px', padding: '11px', fontSize: '13px', fontWeight: 600, textAlign: 'center', cursor: feedbackMutation.isPending ? 'not-allowed' : 'pointer', background: 'var(--amaranth-btn)', color: 'white', opacity: feedbackMutation.isPending ? 0.7 : 1, userSelect: 'none' }}
            >{feedbackMutation.isPending ? t('feedback.sending') : t('feedback.send')}</motion.div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default FeedbackModal
