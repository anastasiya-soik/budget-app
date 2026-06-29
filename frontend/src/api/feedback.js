import client from './client'

const feedbackApi = {
  send: async (message) => {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera || ''
    const { data } = await client.post('/feedback', { message, user_agent: userAgent })
    return data
  },
}

export default feedbackApi
