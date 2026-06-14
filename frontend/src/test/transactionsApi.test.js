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
import transactionsApi from '../api/transactions'

beforeEach(() => vi.clearAllMocks())

describe('transactionsApi.list', () => {
  it('calls GET /transactions with no params when all empty', async () => {
    client.get.mockResolvedValue({ data: { items: [], next_cursor: null } })
    await transactionsApi.list({ category_id: '', type: '', search: '' })
    expect(client.get).toHaveBeenCalledWith('/transactions', { params: {} })
  })

  it('strips null and empty string params', async () => {
    client.get.mockResolvedValue({ data: { items: [] } })
    await transactionsApi.list({ date_from: '2024-01-01', category_id: '', type: null })
    expect(client.get).toHaveBeenCalledWith('/transactions', { params: { date_from: '2024-01-01' } })
  })

  it('passes valid params through', async () => {
    client.get.mockResolvedValue({ data: { items: [] } })
    await transactionsApi.list({ date_from: '2024-01-01', date_to: '2024-01-31', type: 'expense' })
    expect(client.get).toHaveBeenCalledWith('/transactions', {
      params: { date_from: '2024-01-01', date_to: '2024-01-31', type: 'expense' },
    })
  })

  it('returns response data', async () => {
    const payload = { items: [{ id: '1', amount_cents: 500 }], next_cursor: null }
    client.get.mockResolvedValue({ data: payload })
    const result = await transactionsApi.list()
    expect(result).toEqual(payload)
  })
})

describe('transactionsApi.create', () => {
  it('posts to /transactions with body', async () => {
    const body = { amount_cents: 1000, category_id: 'cat1', tx_date: '2024-01-15' }
    const created = { id: 'tx1', ...body }
    client.post.mockResolvedValue({ data: created })
    const result = await transactionsApi.create(body)
    expect(client.post).toHaveBeenCalledWith('/transactions', body)
    expect(result).toEqual(created)
  })
})

describe('transactionsApi.update', () => {
  it('patches /transactions/{id} with body', async () => {
    const updated = { id: 'tx1', amount_cents: 2000 }
    client.patch.mockResolvedValue({ data: updated })
    const result = await transactionsApi.update('tx1', { amount_cents: 2000 })
    expect(client.patch).toHaveBeenCalledWith('/transactions/tx1', { amount_cents: 2000 })
    expect(result).toEqual(updated)
  })
})

describe('transactionsApi.remove', () => {
  it('deletes /transactions/{id}', async () => {
    client.delete.mockResolvedValue({ data: { ok: true } })
    const result = await transactionsApi.remove('tx1')
    expect(client.delete).toHaveBeenCalledWith('/transactions/tx1')
    expect(result).toEqual({ ok: true })
  })
})

describe('transactionsApi.importPreview', () => {
  it('posts to /transactions/import/preview with FormData', async () => {
    client.post.mockResolvedValue({ data: { rows: [], headers: [] } })
    const file = new File(['a,b\n1,2'], 'test.csv', { type: 'text/csv' })
    await transactionsApi.importPreview(file)
    const [url, fd] = client.post.mock.calls[0]
    expect(url).toBe('/transactions/import/preview')
    expect(fd).toBeInstanceOf(FormData)
    expect(fd.get('file')).toBe(file)
  })
})

describe('transactionsApi.importConfirm', () => {
  it('posts to /transactions/import/confirm with file and mapping', async () => {
    client.post.mockResolvedValue({ data: { created: 2, skipped: 0 } })
    const file = new File(['a,b\n1,2'], 'test.csv')
    const mapping = { date_col: 0, amount_col: 1, category_col: null, note_col: null }
    await transactionsApi.importConfirm(file, mapping)
    const [url, fd] = client.post.mock.calls[0]
    expect(url).toBe('/transactions/import/confirm')
    expect(fd.get('file')).toBe(file)
    expect(fd.get('mapping')).toBe(JSON.stringify(mapping))
  })
})
