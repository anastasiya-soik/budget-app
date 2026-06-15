import { useTranslation } from 'react-i18next'

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1)
const YEARS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i)

function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate()
}

function getMonthNames(lang) {
  return Array.from({ length: 12 }, (_, i) =>
    new Date(2000, i, 1).toLocaleString(lang === 'ru' ? 'ru-RU' : 'en-US', { month: 'long' })
  )
}

export function DateSelect({ value, onChange, style }) {
  const { i18n } = useTranslation()
  const lang = i18n.language?.startsWith('ru') ? 'ru' : 'en'
  const months = getMonthNames(lang)

  const [year, month, day] = value
    ? value.split('-').map(Number)
    : [new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate()]

  const maxDay = daysInMonth(year, month)
  const clampedDay = Math.min(day, maxDay)

  const emit = (y, m, d) => {
    const clamped = Math.min(d, daysInMonth(y, m))
    onChange(`${y}-${String(m).padStart(2, '0')}-${String(clamped).padStart(2, '0')}`)
  }

  const sel = {
    borderRadius: '10px',
    padding: '10px 8px',
    fontSize: '14px',
    border: '1px solid var(--border-card)',
    background: 'var(--surface)',
    color: 'var(--text-primary)',
    outline: 'none',
    cursor: 'pointer',
    appearance: 'none',
    WebkitAppearance: 'none',
    textAlign: 'center',
    ...style,
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 3fr 2.5fr', gap: '6px' }}>
      <select value={clampedDay} onChange={e => emit(year, month, +e.target.value)} style={sel}>
        {Array.from({ length: maxDay }, (_, i) => i + 1).map(d => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>

      <select value={month} onChange={e => emit(year, +e.target.value, clampedDay)} style={sel}>
        {months.map((name, i) => (
          <option key={i + 1} value={i + 1}>{name}</option>
        ))}
      </select>

      <select value={year} onChange={e => emit(+e.target.value, month, clampedDay)} style={sel}>
        {YEARS.map(y => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
    </div>
  )
}
