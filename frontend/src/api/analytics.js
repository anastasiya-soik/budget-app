import client from './client'

const analyticsApi = {
  summary: async (month) => {
    const { data } = await client.get('/analytics/summary', { params: { month } })
    return data
  },

  categories: async (month) => {
    const { data } = await client.get('/analytics/categories', { params: { month } })
    return data
  },

  trend: async (months = 6) => {
    const { data } = await client.get('/analytics/trend', { params: { months } })
    return data
  },

  runningTotal: async () => {
    const { data } = await client.get('/analytics/running-total')
    return data
  },

  filterSummary: async (params = {}) => {
    const cleaned = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== '' && v != null)
    )
    const { data } = await client.get('/analytics/filter-summary', { params: cleaned })
    return data
  },
}

export default analyticsApi
