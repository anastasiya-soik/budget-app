import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('../api/client', () => ({
  default: { get: vi.fn() },
}))

import client from '../api/client'
import analyticsApi from '../api/analytics'

beforeEach(() => vi.clearAllMocks())

describe('analyticsApi.summary', () => {
  it('gets /analytics/summary with month param', async () => {
    const payload = { month: '2024-01', income_cents: 100000, expense_cents: 60000, balance_cents: 40000 }
    client.get.mockResolvedValue({ data: payload })
    const result = await analyticsApi.summary('2024-01')
    expect(client.get).toHaveBeenCalledWith('/analytics/summary', { params: { month: '2024-01' } })
    expect(result).toEqual(payload)
  })
})

describe('analyticsApi.categories', () => {
  it('gets /analytics/categories with month param', async () => {
    const payload = { items: [{ category_id: '1', name: 'Food', total_cents: 5000, percentage: 50 }] }
    client.get.mockResolvedValue({ data: payload })
    const result = await analyticsApi.categories('2024-01')
    expect(client.get).toHaveBeenCalledWith('/analytics/categories', { params: { month: '2024-01' } })
    expect(result).toEqual(payload)
  })
})

describe('analyticsApi.trend', () => {
  it('gets /analytics/trend with default months=6', async () => {
    const payload = { items: [] }
    client.get.mockResolvedValue({ data: payload })
    await analyticsApi.trend()
    expect(client.get).toHaveBeenCalledWith('/analytics/trend', { params: { months: 6 } })
  })

  it('passes custom months value', async () => {
    client.get.mockResolvedValue({ data: { items: [] } })
    await analyticsApi.trend(12)
    expect(client.get).toHaveBeenCalledWith('/analytics/trend', { params: { months: 12 } })
  })

  it('returns trend data', async () => {
    const payload = { items: [{ month: '2024-01', income_cents: 100000, expense_cents: 60000 }] }
    client.get.mockResolvedValue({ data: payload })
    const result = await analyticsApi.trend(1)
    expect(result).toEqual(payload)
  })
})
