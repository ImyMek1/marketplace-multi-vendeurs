import api from './api'

const adminService = {
  async getDashboard() {
    const response = await api.get('/admin/dashboard')
    return response.data
  },

  async getUsers(params = {}) {
    const response = await api.get('/admin/users', { params })
    return response.data
  },

  async getUser(userId) {
    const response = await api.get(`/admin/users/${userId}`)
    return response.data
  },

  async updateUserStatus(userId, status) {
    const response = await api.patch(`/admin/users/${userId}/status`, { status })
    return response.data
  },

  async getShops(params = {}) {
    const response = await api.get('/admin/shops', { params })
    return response.data
  },

  async getShop(shopId) {
    const response = await api.get(`/admin/shops/${shopId}`)
    return response.data
  },

  async approveShop(shopId) {
    const response = await api.patch(`/admin/shops/${shopId}/approve`)
    return response.data
  },

  async suspendShop(shopId) {
    const response = await api.patch(`/admin/shops/${shopId}/suspend`)
    return response.data
  },

  async activateShop(shopId) {
    const response = await api.patch(`/admin/shops/${shopId}/activate`)
    return response.data
  },

  async getProducts(params = {}) {
    const response = await api.get('/admin/products', { params })
    return response.data
  },

  async getProduct(productId) {
    const response = await api.get(`/admin/products/${productId}`)
    return response.data
  },

  async approveProduct(productId) {
    const response = await api.patch(`/admin/products/${productId}/approve`)
    return response.data
  },

  async rejectProduct(productId) {
    const response = await api.patch(`/admin/products/${productId}/reject`)
    return response.data
  },

  async disableProduct(productId) {
    const response = await api.delete(`/products/${productId}`)
    return response.data
  },

  async getOrders(params = {}) {
    const response = await api.get('/admin/orders', { params })
    return response.data
  },

  async getOrder(orderId) {
    const response = await api.get(`/admin/orders/${orderId}`)
    return response.data
  },

  async updateOrderStatus(orderId, status) {
    const response = await api.patch(`/orders/${orderId}/status`, { status })
    return response.data
  },

  async getDeliveries(params = {}) {
    const response = await api.get('/admin/deliveries', { params })
    return response.data
  },

  async getDelivery(deliveryId) {
    const response = await api.get(`/admin/deliveries/${deliveryId}`)
    return response.data
  },

  async getDeliveryHistory(deliveryId, params = {}) {
    const response = await api.get(`/admin/deliveries/${deliveryId}/history`, { params })
    return response.data
  },

  async assignDriver(orderId, driverId) {
    const response = await api.patch(`/admin/orders/${orderId}/delivery/assign`, {
      driver_id: driverId,
    })
    return response.data
  },

  async getCategories(params = {}) {
    const response = await api.get('/admin/categories', { params })
    return response.data
  },

  async createCategory(data) {
    const response = await api.post('/admin/categories', data)
    return response.data
  },

  async updateCategory(categoryId, data) {
    const response = await api.put(`/admin/categories/${categoryId}`, data)
    return response.data
  },

  async deleteCategory(categoryId) {
    const response = await api.delete(`/admin/categories/${categoryId}`)
    return response.data
  },

  async getReviews(params = {}) {
    const response = await api.get('/admin/reviews', { params })
    return response.data
  },

  async approveReview(reviewId) {
    const response = await api.patch(`/admin/reviews/${reviewId}/approve`)
    return response.data
  },

  async rejectReview(reviewId) {
    const response = await api.patch(`/admin/reviews/${reviewId}/reject`)
    return response.data
  },

  async getCoupons(params = {}) {
    const response = await api.get('/admin/coupons', { params })
    return response.data
  },

  async createCoupon(data) {
    const response = await api.post('/admin/coupons', data)
    return response.data
  },

  async updateCoupon(couponId, data) {
    const response = await api.put(`/admin/coupons/${couponId}`, data)
    return response.data
  },

  async updateCouponStatus(couponId, status) {
    const response = await api.patch(`/admin/coupons/${couponId}/status`, { status })
    return response.data
  },

  async getCommissions(params = {}) {
    const response = await api.get('/admin/commissions', { params })
    return response.data
  },
}

export default adminService
