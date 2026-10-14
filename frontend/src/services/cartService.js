import api from './api'

const cartService = {
  async getCart() {
    const response = await api.get('/cart')
    return response.data
  },

  async addItem(productId, quantity = 1) {
    const response = await api.post('/cart/items', {
      product_id: productId,
      quantity,
    })

    return response.data
  },

  async updateItem(itemId, quantity) {
    const response = await api.put(`/cart/items/${itemId}`, {
      quantity,
    })

    return response.data
  },

  async removeItem(itemId) {
    const response = await api.delete(`/cart/items/${itemId}`)
    return response.data
  },
}

export default cartService