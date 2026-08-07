import { api } from './httpClient'

export async function getAdminNotifications() {
  return api.get('/admin-notifications')
}

export async function markNotificationRead(id) {
  return api.put(`/admin-notifications/${id}/read`, {})
}

export async function markAllNotificationsRead() {
  return api.put('/admin-notifications/read-all', {})
}
