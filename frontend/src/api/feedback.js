import client from './client'

const feedbackApi = {
  send: async (message) => {
    const { data } = await client.post('/feedback', { message })
    return data
  },
}

export default feedbackApi
