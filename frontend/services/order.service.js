import api from '../utils/api';

export const orderService = {
  async getOrders(params = {}) {
    const res = await api.get('/orders', { params });
    return res.data;
  },

  async getOrderById(id) {
    const res = await api.get(`/orders/${id}`);
    return res.data;
  },

  async createOrder(data) {
    const res = await api.post('/orders', data);
    return res.data;
  },

  async updateOrderStatus(id, status) {
    const res = await api.patch(`/orders/${id}/status`, { status });
    return res.data;
  }
};
