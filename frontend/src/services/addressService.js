import api from './api'

const addressService = {
  async getAddresses() {
    const response = await api.get('/addresses')
    return response.data
  },

  async createAddress(data) {
    const response = await api.post('/addresses', data)
    return response.data
  },

  async updateAddress(addressId, data) {
    const response = await api.put(`/addresses/${addressId}`, data)
    return response.data
  },

  async deleteAddress(addressId) {
    const response = await api.delete(`/addresses/${addressId}`)
    return response.data
  },
}

export default addressService