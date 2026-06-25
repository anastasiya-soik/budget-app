import client from './client'

const authApi = {
  register: async (email, password) => {
    const { data } = await client.post('/auth/register', { email, password })
    return data
  },

  login: async (email, password) => {
    const { data } = await client.post('/auth/login', { email, password })
    return data
  },

  logout: async () => {
    const { data } = await client.post('/auth/logout')
    return data
  },

  getMe: async () => {
    const { data } = await client.get('/user/me')
    return data
  },

  updateMe: async (body) => {
    const { data } = await client.patch('/user/me', body)
    return data
  },

  changePassword: async (old_password, new_password) => {
    await client.post('/user/me/password', { old_password, new_password })
  },

  refresh: async () => {
    const { data } = await client.post('/auth/refresh')
    return data
  },

  telegramLogin: async (initData) => {
    const { data } = await client.post('/auth/telegram', { init_data: initData })
    return data
  },

  deleteAccount: async () => {
    await client.delete('/user/me')
  },

  exportData: async () => {
    const response = await client.get('/user/me/export', { responseType: 'blob' })
    const url = URL.createObjectURL(new Blob([response.data], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url
    a.download = 'purrse-export.json'
    a.click()
    URL.revokeObjectURL(url)
  },
}

export default authApi
