import api from './api'

const driverService = {
  async getDashboard() {
    const response = await api.get('/driver/dashboard')
    return response.data
  },

  async getDeliveries(params = {}) {
    const response = await api.get('/driver/deliveries', {
      params,
    })

    return response.data
  },

  async getDelivery(deliveryId) {
    const response = await api.get(`/driver/deliveries/${deliveryId}`)
    return response.data
  },

  async getDeliveryHistory(deliveryId, params = {}) {
    const response = await api.get(
      `/driver/deliveries/${deliveryId}/history`,
      { params },
    )

    return response.data
  },

  async updateDeliveryStatus(deliveryId, status, note = '') {
    const response = await api.patch(
      `/driver/deliveries/${deliveryId}/status`,
      { status, note },
    )

    return response.data
  },
}

export default driverService
