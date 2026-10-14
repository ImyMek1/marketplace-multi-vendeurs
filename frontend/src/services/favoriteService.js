import api from './api'

const favoriteService = {
  async getFavorites() {
    const response = await api.get('/favorites')

    return response.data
  },

  async addFavorite(productId) {
    const response = await api.post('/favorites', {
      product_id: productId,
    })

    return response.data
  },

  async removeFavorite(favoriteId) {
    const response = await api.delete(`/favorites/${favoriteId}`)

    return response.data
  },
}

export default favoriteService