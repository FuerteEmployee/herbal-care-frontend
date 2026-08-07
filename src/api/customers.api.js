import { api } from './httpClient'

export function mapCustomerFromApi(c) {
  return {
    id: c._id,
    name: c.name,
    email: c.email ?? '',
    phone: c.phone ?? '',
    addresses: (c.addresses ?? []).map((a) => ({ ...a, id: a._id })),
    status: c.status ?? 'active',
  }
}

function toQuery(params = {}) {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== '') qs.set(k, v)
  })
  return qs.toString()
}

export async function getCustomers(params = {}) {
  const qs = toQuery(params)
  const url = `/customers${qs ? `?${qs}` : ''}`
  return (await api.get(url)).map(mapCustomerFromApi)
}

export async function getCustomerById(id) {
  return mapCustomerFromApi(await api.get(`/customers/${id}`))
}
