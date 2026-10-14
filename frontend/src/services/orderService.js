import api from './api'

const orderService = {
  async getOrders() {
    const response = await api.get('/orders')
    return response.data
  },

  async getOrder(orderId) {
    const response = await api.get(`/orders/${orderId}`)
    return response.data
  },

  async createOrder(data) {
    const response = await api.post('/orders', data)
    return response.data
  },
}

export default orderService