export const formatMoney = (cents, currency = 'USD') => {
  if (cents == null) return '—'
  const amount = cents / 100
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(amount)
  } catch {
    return `${currency} ${amount.toFixed(2)}`
  }
}

export const formatDate = (dateStr) => {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

export const currentMonth = () => new Date().toISOString().slice(0, 7)

// Add/subtract whole months from a 'YYYY-MM' string, returning 'YYYY-MM'.
export const shiftMonth = (monthStr, delta) => {
  const [year, month] = monthStr.split('-').map(Number)
  const d = new Date(Date.UTC(year, month - 1 + delta, 1))
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}
export const today = () => new Date().toISOString().slice(0, 10)
export const firstOfMonth = () => {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10)
}

export const apiError = (err) => {
  const detail = err?.response?.data?.detail
  if (Array.isArray(detail)) return detail.map(d => d.msg || String(d)).join('; ')
  if (detail && typeof detail === 'object') return detail.msg || JSON.stringify(detail)
  return detail || err?.message || 'Something went wrong'
}
