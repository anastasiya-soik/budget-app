import { motion, AnimatePresence } from 'framer-motion'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import transactionsApi from '../api/transactions'
import { apiError } from '../utils/apiError'
import { useScrollLock } from '../hooks/useScrollLock'

const overlayStyle = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  background: 'rgba(0,0,0,0.5)', display: 'flex',
  alignItems: 'center', justifyContent: 'center', zIndex: 1000,
}

const cardStyle = {
  background: 'var(--surface)', borderRadius: '16px', padding: '24px',
  maxWidth: '480px', width: '90%', maxHeight: '90vh', overflowY: 'auto',
  boxShadow: '0 12px 24px rgba(0,0,0,0.15)',
}

const inputStyle = {
  width: '100%', borderRadius: '10px', padding: '10px 14px', fontSize: '14px',
  border: '1px solid var(--border-card)', background: 'var(--surface)',
  color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box',
}

const ImportPdfModal = ({ onClose, onSuccess }) => {
  useScrollLock()
  const { t } = useTranslation()
  const [step, setStep] = useState(1) // 1=select, 2=preview, 3=done
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const fileRef = useRef()

  const handleFileChange = (e) => {
    setFile(e.target.files[0] || null)
    setError('')
  }

  const handlePreview = async () => {
    if (!file) { setError(t('transactions.importPdfSelectFile')); return }
    setLoading(true)
    setError('')
    try {
      const data = await transactionsApi.importPdfPreview(file)
      setPreview(data)
      setStep(2)
    } catch (e) {
      setError(apiError(e))
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await transactionsApi.importPdfConfirm(file, categoryId || null)
      setResult(data)
      setStep(3)
      onSuccess()
    } catch (e) {
      setError(apiError(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={overlayStyle} onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }}
        style={cardStyle} onClick={(e) => e.stopPropagation()}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            {step === 1 ? t('transactions.importPdfTitle1') :
             step === 2 ? t('transactions.importPdfTitle2') :
             t('transactions.importTitle3')}
          </h3>
          <div style={{ display: 'flex', gap: '4px' }}>
            {[1, 2, 3].map(s => (
              <div key={s} style={{ width: '24px', height: '4px', borderRadius: '2px', background: s <= step ? 'var(--amaranth)' : 'var(--border-card)' }} />
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.18 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
              {t('transactions.importPdfHint')}
            </p>
            <div
              style={{ border: '2px dashed var(--border-card)', borderRadius: '12px', padding: '32px 16px', textAlign: 'center', cursor: 'pointer' }}
              onClick={() => fileRef.current?.click()}
            >
              <input ref={fileRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={handleFileChange} />
              {file
                ? <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500 }}>{file.name}</span>
                : <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{t('transactions.importPdfChoose')}</span>
              }
            </div>
            {error && <div style={{ background: 'rgba(229,43,80,0.08)', border: '1px solid rgba(229,43,80,0.2)', color: '#E52B50', fontSize: '13px', borderRadius: '10px', padding: '10px 14px' }}>{error}</div>}
            <div style={{ display: 'flex', gap: '10px' }}>
              <motion.div whileTap={{ scale: 0.97 }} onClick={onClose}
                style={{ flex: 1, borderRadius: '10px', padding: '11px', fontSize: '13px', fontWeight: 500, textAlign: 'center', cursor: 'pointer', border: '1px solid var(--border-card)', color: 'var(--text-primary)', background: 'var(--surface)', userSelect: 'none' }}>
                {t('transactions.cancel')}
              </motion.div>
              <motion.div whileTap={{ scale: 0.97 }} onClick={loading ? undefined : handlePreview}
                style={{ flex: 1, borderRadius: '10px', padding: '11px', fontSize: '13px', fontWeight: 600, textAlign: 'center', cursor: loading ? 'not-allowed' : 'pointer', background: 'var(--amaranth-btn)', color: 'white', opacity: loading ? 0.7 : 1, userSelect: 'none' }}>
                {loading ? t('transactions.loading') : t('transactions.next')}
              </motion.div>
            </div>
          </motion.div>
        )}

        {step === 2 && preview && (
          <motion.div key="step2" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.18 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
              {t('transactions.importPdfFound', { count: preview.transactions.length })}
            </p>
            {preview.transactions.length > 0 && (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse', color: 'var(--text-secondary)' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-card)' }}>
                      <th style={{ padding: '6px 8px', textAlign: 'left', whiteSpace: 'nowrap' }}>Дата</th>
                      <th style={{ padding: '6px 8px', textAlign: 'right', whiteSpace: 'nowrap' }}>Сумма</th>
                      <th style={{ padding: '6px 8px', textAlign: 'left', whiteSpace: 'nowrap' }}>Описание</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.transactions.slice(0, 5).map((tx, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--tx-border)' }}>
                        <td style={{ padding: '6px 8px', whiteSpace: 'nowrap' }}>{tx.date}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'right', whiteSpace: 'nowrap' }}>{tx.amount.toFixed(2)}</td>
                        <td style={{ padding: '6px 8px', whiteSpace: 'nowrap', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tx.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {error && <div style={{ background: 'rgba(229,43,80,0.08)', border: '1px solid rgba(229,43,80,0.2)', color: '#E52B50', fontSize: '13px', borderRadius: '10px', padding: '10px 14px' }}>{error}</div>}
            <div style={{ display: 'flex', gap: '10px' }}>
              <motion.div whileTap={{ scale: 0.97 }} onClick={() => { setStep(1); setError('') }}
                style={{ flex: 1, borderRadius: '10px', padding: '11px', fontSize: '13px', fontWeight: 500, textAlign: 'center', cursor: 'pointer', border: '1px solid var(--border-card)', color: 'var(--text-primary)', background: 'var(--surface)', userSelect: 'none' }}>
                {t('transactions.back')}
              </motion.div>
              <motion.div whileTap={{ scale: 0.97 }} onClick={loading ? undefined : handleConfirm}
                style={{ flex: 1, borderRadius: '10px', padding: '11px', fontSize: '13px', fontWeight: 600, textAlign: 'center', cursor: loading ? 'not-allowed' : 'pointer', background: 'var(--amaranth-btn)', color: 'white', opacity: loading ? 0.7 : 1, userSelect: 'none' }}>
                {loading ? t('transactions.importing') : t('transactions.importPdf')}
              </motion.div>
            </div>
          </motion.div>
        )}

        {step === 3 && result && (
          <motion.div key="step3" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.18 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '36px' }}>✓</div>
            <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              {t('transactions.importPdfDone', { created: result.created })}
            </p>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
              {result.skipped > 0 ? t('transactions.importStats', { created: result.created, skipped: result.skipped }) : ''}
            </p>
            <motion.div whileTap={{ scale: 0.97 }} onClick={onClose}
              style={{ borderRadius: '10px', padding: '11px', fontSize: '13px', fontWeight: 600, textAlign: 'center', cursor: 'pointer', background: 'var(--amaranth-btn)', color: 'white', userSelect: 'none' }}>
              {t('transactions.close')}
            </motion.div>
          </motion.div>
        )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}

export default ImportPdfModal
