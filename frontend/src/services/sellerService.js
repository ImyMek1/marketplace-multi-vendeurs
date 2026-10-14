
import api from './api'

const sellerService = {
  async getDashboard() {
    const response = await api.get('/seller/dashboard')
    return response.data
  },

  async getProducts(params = {}) {
    const response = await api.get('/seller/products', {
      params,
    })
    return response.data
  },

  async createProduct(data) {
    const response = await api.post('/products', data)
    return response.data
  },

  async updateProduct(productId, data) {
    const response = await api.put(
      `/products/${productId}`,
      data,
    )
    return response.data
  },

  async disableProduct(productId) {
    const response = await api.delete(
      `/products/${productId}`,
    )
    return response.data
  },

  async uploadProductImage(productId, data) {
    const response = await api.post(
      `/products/${productId}/images`,
      data,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    )

    return response.data
  },

  async deleteProductImage(imageId) {
    const response = await api.delete(
      `/product-images/${imageId}`,
    )
    return response.data
  },

  async getOrders(params = {}) {
    const response = await api.get('/seller/orders', {
      params,
    })
    return response.data
  },

  async updateOrderStatus(orderId, status) {
    const response = await api.patch(
      `/orders/${orderId}/status`,
      { status },
    )

    return response.data
  },

  async createShop(data) {
  const response = await api.post('/shops', data)
  return response.data
},

  async getShop() {
    const response = await api.get('/seller/shop')
    return response.data
  },

  async updateShop(data) {
    const response = await api.put('/seller/shop', data)
    return response.data
  },
}

export default sellerService
