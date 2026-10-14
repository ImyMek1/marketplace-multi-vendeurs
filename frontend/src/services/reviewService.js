import api from './api'

const reviewService = {
  async getProductReviews(productId) {
    const response = await api.get(`/products/${productId}/reviews`)
    return response.data
  },

  async createReview(data) {
    const response = await api.post('/reviews', data)
    return response.data
  },

  async getMyReviews() {
    const response = await api.get('/reviews/me')
    return response.data
  },
}

export default reviewService