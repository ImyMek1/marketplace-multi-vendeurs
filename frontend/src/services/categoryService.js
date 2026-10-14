import api from './api'

const categoryService = {
  async getCategories() {
    const response = await api.get('/categories')
    return response.data
  },
}

export default categoryService