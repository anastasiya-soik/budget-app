import { describe, it, expect } from 'vitest'
import { formatMoney, formatDate, currentMonth, today, firstOfMonth, apiError, shiftMonth } from '../utils'

describe('formatMoney', () => {
  it('formats cents as currency string', () => {
    expect(formatMoney(1050, 'USD')).toBe('$10.50')
  })

  it('formats zero correctly', () => {
    expect(formatMoney(0, 'USD')).toBe('$0.00')
  })

  it('returns em-dash for null', () => {
    expect(formatMoney(null)).toBe('—')
  })

  it('returns em-dash for undefined', () => {
    expect(formatMoney(undefined)).toBe('—')
  })

  it('includes currency code and amount for any 3-letter code', () => {
    const result = formatMoney(1000, 'ZZZ')
    expect(result).toContain('ZZZ')
    expect(result).toContain('10.00')
  })

  it('defaults currency to USD', () => {
    expect(formatMoney(100)).toBe('$1.00')
  })
})

describe('formatDate', () => {
  it('formats a date string', () => {
    expect(formatDate('2024-01-15')).toBe('Jan 15, 2024')
  })

  it('returns em-dash for null', () => {
    expect(formatDate(null)).toBe('—')
  })

  it('returns em-dash for empty string', () => {
    expect(formatDate('')).toBe('—')
  })
})

describe('currentMonth', () => {
  it('returns YYYY-MM format', () => {
    expect(currentMonth()).toMatch(/^\d{4}-\d{2}$/)
  })
})

describe('today', () => {
  it('returns YYYY-MM-DD format', () => {
    expect(today()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

describe('firstOfMonth', () => {
  it('always returns the 1st day', () => {
    expect(firstOfMonth()).toMatch(/^\d{4}-\d{2}-01$/)
  })
})

describe('shiftMonth', () => {
  it('moves forward one month within a year', () => {
    expect(shiftMonth('2026-01', 1)).toBe('2026-02')
  })

  it('moves backward one month within a year', () => {
    expect(shiftMonth('2026-09', -1)).toBe('2026-08')
  })

  it('rolls over to the next year', () => {
    expect(shiftMonth('2026-12', 1)).toBe('2027-01')
  })

  it('rolls back to the previous year', () => {
    expect(shiftMonth('2026-01', -1)).toBe('2025-12')
  })

  it('is a no-op for delta 0', () => {
    expect(shiftMonth('2026-06', 0)).toBe('2026-06')
  })

  it('handles multi-month jumps across a year boundary', () => {
    expect(shiftMonth('2026-11', 3)).toBe('2027-02')
  })
})

describe('apiError', () => {
  it('extracts detail from axios response', () => {
    const err = { response: { data: { detail: 'Not found' } } }
    expect(apiError(err)).toBe('Not found')
  })

  it('falls back to error message', () => {
    const err = { message: 'Network Error' }
    expect(apiError(err)).toBe('Network Error')
  })

  it('falls back to generic string for null', () => {
    expect(apiError(null)).toBe('Something went wrong')
  })

  it('falls back to generic string for empty object', () => {
    expect(apiError({})).toBe('Something went wrong')
  })
})
