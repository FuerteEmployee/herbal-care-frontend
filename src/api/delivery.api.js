import { api } from './httpClient'

function idOf(ref) {
  if (!ref) return ''
  return typeof ref === 'string' ? ref : ref._id
}

export function mapDeliveryFromApi(d) {
  return {
    id: d._id,
    orderId: idOf(d.order),
    order: d.order && typeof d.order === 'object' ? d.order : null,
    executiveId: idOf(d.executive),
    executive: d.executive && typeof d.executive === 'object' ? d.executive : null,
    status: d.status ?? 'pending',
    location: d.location ?? null,
    eta: d.eta ?? null,
    assignedAt: d.assignedAt ?? null,
    completedAt: d.completedAt ?? null,
  }
}

export function mapExecutiveFromApi(e) {
  return {
    id: e._id,
    name: e.name,
    phone: e.phone ?? '',
    email: e.email ?? '',
    vehicleNumber: e.vehicleNumber ?? '',
    warehouseId: idOf(e.warehouse),
    active: e.active !== false,
  }
}

function toQuery(params = {}) {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== '') qs.set(k, v)
  })
  return qs.toString()
}

export async function getDeliveries(params = {}) {
  const qs = toQuery(params)
  return (await api.get(`/delivery${qs ? `?${qs}` : ''}`)).map(mapDeliveryFromApi)
}

export async function getDeliveryById(id) {
  return mapDeliveryFromApi(await api.get(`/delivery/${id}`))
}

export async function getDeliveryByOrder(orderId) {
  // The backend returns a single delivery object or null for a given order
  try {
    const result = await api.get(`/delivery/${orderId}`)
    return mapDeliveryFromApi(result)
  } catch {
    return null
  }
}

export async function getDeliveryExecutives() {
  return (await api.get('/delivery/executives')).map(mapExecutiveFromApi)
}

export async function createDeliveryExecutive(data) {
  const exec = await api.post('/delivery/executives', {
    name: data.name,
    phone: data.phone,
    email: data.email || undefined,
    vehicleNumber: data.vehicleNumber || undefined,
    warehouse: data.warehouseId || undefined,
  })
  return mapExecutiveFromApi(exec)
}

export async function updateDeliveryExecutive(id, data) {
  const exec = await api.put(`/delivery/executives/${id}`, {
    name: data.name,
    phone: data.phone,
    email: data.email || undefined,
    vehicleNumber: data.vehicleNumber || undefined,
    warehouse: data.warehouseId || undefined,
  })
  return mapExecutiveFromApi(exec)
}

export async function assignDelivery(orderId, executiveId) {
  const delivery = await api.post('/delivery/assign', { orderId, executiveId })
  return mapDeliveryFromApi(delivery)
}

export async function autoAssignDeliveries() {
  return api.post('/delivery/auto-assign', {})
}

export async function bulkAssignDeliveries(orderIds, executiveId) {
  return (await api.post('/delivery/bulk-assign', { orderIds, executiveId })).map(mapDeliveryFromApi)
}

export async function updateDeliveryLocation(id, lat, lng, eta) {
  const delivery = await api.put(`/delivery/${id}/location`, { lat, lng, eta })
  return mapDeliveryFromApi(delivery)
}

export async function updateDeliveryStatus(id, status) {
  const delivery = await api.put(`/delivery/${id}/status`, { status })
  return mapDeliveryFromApi(delivery)
}

export async function confirmDelivery(id, { receiverName, receiverPhone, remarks, photoUrl }) {
  const delivery = await api.post(`/delivery/${id}/confirm`, { receiverName, receiverPhone, remarks, photoUrl })
  return mapDeliveryFromApi(delivery)
}

export async function generateDeliveryOtp(id) {
  return api.post(`/delivery/${id}/otp/generate`, {})
}

export async function verifyDeliveryOtp(id, otp) {
  await api.post(`/delivery/${id}/otp/verify`, { code: otp })
  return getDeliveryById(id)
}

export async function uploadDeliveryProofPhoto(file) {
  const formData = new FormData()
  formData.append('file', file)
  const { url } = await api.upload('/uploads/delivery-proof', formData)
  return url
}

export async function getExecutivePerformanceReport() {
  return api.get('/delivery/reports/executive-performance')
}

export async function getDailyDeliveryReport() {
  return api.get('/delivery/reports/daily')
}
