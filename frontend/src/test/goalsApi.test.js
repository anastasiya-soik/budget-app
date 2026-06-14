import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('../api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

import client from '../api/client'
import goalsApi from '../api/goals'

beforeEach(() => vi.clearAllMocks())

describe('goalsApi.list', () => {
  it('gets /goals and returns data', async () => {
    const goals = [{ id: 'g1', name: 'Emergency fund', target_cents: 1000000, current_cents: 250000 }]
    client.get.mockResolvedValue({ data: goals })
    const result = await goalsApi.list()
    expect(client.get).toHaveBeenCalledWith('/goals')
    expect(result).toEqual(goals)
  })
})

describe('goalsApi.create', () => {
  it('posts to /goals with body', async () => {
    const body = { name: 'Vacation', target_cents: 500000, current_cents: 0 }
    const created = { id: 'g2', ...body }
    client.post.mockResolvedValue({ data: created })
    const result = await goalsApi.create(body)
    expect(client.post).toHaveBeenCalledWith('/goals', body)
    expect(result).toEqual(created)
  })
})

describe('goalsApi.update', () => {
  it('patches /goals/{id} with body', async () => {
    const updated = { id: 'g1', current_cents: 300000 }
    client.patch.mockResolvedValue({ data: updated })
    const result = await goalsApi.update('g1', { current_cents: 300000 })
    expect(client.patch).toHaveBeenCalledWith('/goals/g1', { current_cents: 300000 })
    expect(result).toEqual(updated)
  })
})

describe('goalsApi.remove', () => {
  it('deletes /goals/{id}', async () => {
    client.delete.mockResolvedValue({ data: { ok: true } })
    const result = await goalsApi.remove('g1')
    expect(client.delete).toHaveBeenCalledWith('/goals/g1')
    expect(result).toEqual({ ok: true })
  })
})
