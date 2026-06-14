import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('../api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}))

import client from '../api/client'
import budgetsApi from '../api/budgets'

beforeEach(() => vi.clearAllMocks())

describe('budgetsApi.list', () => {
  it('gets /budgets with month param', async () => {
    const budgets = [{ id: 'b1', category_id: 'c1', month: '2024-01', limit_cents: 50000 }]
    client.get.mockResolvedValue({ data: budgets })
    const result = await budgetsApi.list('2024-01')
    expect(client.get).toHaveBeenCalledWith('/budgets', { params: { month: '2024-01' } })
    expect(result).toEqual(budgets)
  })
})

describe('budgetsApi.upsert', () => {
  it('posts to /budgets with category_id, month, limit_cents', async () => {
    const created = { id: 'b1', category_id: 'c1', month: '2024-01', limit_cents: 50000 }
    client.post.mockResolvedValue({ data: created })
    const result = await budgetsApi.upsert('c1', '2024-01', 50000)
    expect(client.post).toHaveBeenCalledWith('/budgets', {
      category_id: 'c1',
      month: '2024-01',
      limit_cents: 50000,
    })
    expect(result).toEqual(created)
  })
})

describe('budgetsApi.remove', () => {
  it('deletes /budgets/{id}', async () => {
    client.delete.mockResolvedValue({ data: undefined })
    await budgetsApi.remove('b1')
    expect(client.delete).toHaveBeenCalledWith('/budgets/b1')
  })
})

describe('budgetsApi.bars', () => {
  it('gets /analytics/budget with month param', async () => {
    const bars = [{ category_id: 'c1', name: 'Food', limit_cents: 50000, actual_cents: 30000, pct: 60 }]
    client.get.mockResolvedValue({ data: bars })
    const result = await budgetsApi.bars('2024-01')
    expect(client.get).toHaveBeenCalledWith('/analytics/budget', { params: { month: '2024-01' } })
    expect(result).toEqual(bars)
  })
})
