import { api } from './httpClient'

export function mapWarehouseFromApi(w) {
  return {
    id: w._id,
    name: w.name,
    code: w.code ?? '',
    address: w.address ?? '',
    city: w.city ?? '',
    state: w.state ?? '',
    status: w.status ?? 'active',
  }
}

function toQuery(params = {}) {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== '') qs.set(k, v)
  })
  return qs.toString()
}

export async function getWarehouses() {
  return (await api.get('/warehouse')).map(mapWarehouseFromApi)
}

export async function getWarehousesPage(params = {}) {
  const qs = toQuery(params)
  const res = await api.get(`/warehouse${qs ? `?${qs}` : ''}`)
  if (Array.isArray(res)) {
    return { items: res.map(mapWarehouseFromApi), total: res.length, page: 1, limit: res.length }
  }
  return {
    items: (res.items ?? []).map(mapWarehouseFromApi),
    total: res.total ?? 0,
    page: res.page ?? 1,
    limit: res.limit ?? 10,
  }
}
