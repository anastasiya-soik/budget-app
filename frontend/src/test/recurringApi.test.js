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
import recurringApi from '../api/recurring'

beforeEach(() => vi.clearAllMocks())

describe('recurringApi.list', () => {
  it('gets /recurring and returns data', async () => {
    const items = [{ id: 'r1', amount_cents: 10000, frequency: 'monthly', is_active: true }]
    client.get.mockResolvedValue({ data: items })
    const result = await recurringApi.list()
    expect(client.get).toHaveBeenCalledWith('/recurring')
    expect(result).toEqual(items)
  })
})

describe('recurringApi.create', () => {
  it('posts to /recurring with body', async () => {
    const body = { amount_cents: 5000, frequency: 'weekly', start_date: '2024-01-01' }
    const created = { id: 'r1', ...body }
    client.post.mockResolvedValue({ data: created })
    const result = await recurringApi.create(body)
    expect(client.post).toHaveBeenCalledWith('/recurring', body)
    expect(result).toEqual(created)
  })
})

describe('recurringApi.update', () => {
  it('patches /recurring/{id} with body', async () => {
    const updated = { id: 'r1', is_active: false }
    client.patch.mockResolvedValue({ data: updated })
    const result = await recurringApi.update('r1', { is_active: false })
    expect(client.patch).toHaveBeenCalledWith('/recurring/r1', { is_active: false })
    expect(result).toEqual(updated)
  })
})

describe('recurringApi.remove', () => {
  it('deletes /recurring/{id}', async () => {
    client.delete.mockResolvedValue({ data: { ok: true } })
    const result = await recurringApi.remove('r1')
    expect(client.delete).toHaveBeenCalledWith('/recurring/r1')
    expect(result).toEqual({ ok: true })
  })
})
