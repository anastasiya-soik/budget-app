import { useTranslation } from 'react-i18next'

const YEARS = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 4 + i)

function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate()
}

const RU_MONTHS = ['январь','февраль','март','апрель','май','июнь','июль','август','сентябрь','октябрь','ноябрь','декабрь']
const EN_MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

function getMonthNames(lang) {
  if (lang === 'ru') return RU_MONTHS
  try {
    return Array.from({ length: 12 }, (_, i) =>
      new Date(2000, i, 1).toLocaleString('en-US', { month: 'long' })
    )
  } catch {
    return EN_MONTHS
  }
}

export function DateSelect({ value, onChange, style }) {
  const { i18n } = useTranslation()
  const lang = i18n.language?.startsWith('ru') ? 'ru' : 'en'
  const months = getMonthNames(lang)

  const [year, month, day] = value
    ? value.split('-').map(Number)
    : [new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate()]

  const safeYear = YEARS.includes(year) ? year : YEARS[4]
  const maxDay = daysInMonth(safeYear, month)
  const clampedDay = Math.min(day || 1, maxDay)

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
      <select value={clampedDay} onChange={e => emit(safeYear, month, +e.target.value)} style={sel}>
        {Array.from({ length: maxDay }, (_, i) => i + 1).map(d => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>

      <select value={month} onChange={e => emit(safeYear, +e.target.value, clampedDay)} style={sel}>
        {months.map((name, i) => (
          <option key={i + 1} value={i + 1}>{name}</option>
        ))}
      </select>

      <select value={safeYear} onChange={e => emit(+e.target.value, month, clampedDay)} style={sel}>
        {YEARS.map(y => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
    </div>
  )
}
