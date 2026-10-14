import api from './api'

const profileService = {
  async updateProfile(data) {
    const response = await api.put('/auth/profile', data)
    return response.data
  },
}

export default profileService