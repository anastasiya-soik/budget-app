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
import categoriesApi from '../api/categories'

beforeEach(() => vi.clearAllMocks())

describe('categoriesApi.list', () => {
  it('gets /categories and returns data', async () => {
    const cats = [{ id: '1', name: 'Food', color: '#ff0000', type: 'expense' }]
    client.get.mockResolvedValue({ data: cats })
    const result = await categoriesApi.list()
    expect(client.get).toHaveBeenCalledWith('/categories')
    expect(result).toEqual(cats)
  })
})

describe('categoriesApi.create', () => {
  it('posts to /categories with body', async () => {
    const body = { name: 'Transport', color: '#0000ff', type: 'expense' }
    const created = { id: 'c1', ...body }
    client.post.mockResolvedValue({ data: created })
    const result = await categoriesApi.create(body)
    expect(client.post).toHaveBeenCalledWith('/categories', body)
    expect(result).toEqual(created)
  })
})

describe('categoriesApi.update', () => {
  it('patches /categories/{id} with body', async () => {
    const updated = { id: 'c1', name: 'Commute', color: '#0000ff', type: 'expense' }
    client.patch.mockResolvedValue({ data: updated })
    const result = await categoriesApi.update('c1', { name: 'Commute' })
    expect(client.patch).toHaveBeenCalledWith('/categories/c1', { name: 'Commute' })
    expect(result).toEqual(updated)
  })
})

describe('categoriesApi.remove', () => {
  it('deletes /categories/{id}', async () => {
    client.delete.mockResolvedValue({ data: { ok: true } })
    const result = await categoriesApi.remove('c1')
    expect(client.delete).toHaveBeenCalledWith('/categories/c1')
    expect(result).toEqual({ ok: true })
  })
})
