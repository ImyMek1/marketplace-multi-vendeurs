import api from './api'

const productService = {
  async getProducts(params = {}) {
    const response = await api.get('/products', {
      params,
    })

    return response.data
  },

  async getProduct(productId) {
    const response = await api.get(`/products/${productId}`)
    return response.data
  },
}

export default productService