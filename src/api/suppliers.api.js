import { api } from './httpClient'

export function mapSupplierFromApi(s) {
  return {
    id: s._id,
    name: s.name,
    supplierCode: s.supplierCode ?? '',
    email: s.email ?? '',
    phone: s.phone ?? '',
    address: s.address ?? '',
    status: s.status ?? 'active',
    gstNumber: s.gstNumber ?? '',
  }
}

function toQuery(params = {}) {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== '') qs.set(k, v)
  })
  return qs.toString()
}

export async function getSuppliers() {
  return (await api.get('/suppliers')).map(mapSupplierFromApi)
}

export async function getSuppliersPage(params = {}) {
  const qs = toQuery(params)
  const res = await api.get(`/suppliers${qs ? `?${qs}` : ''}`)
  if (Array.isArray(res)) {
    return { items: res.map(mapSupplierFromApi), total: res.length, page: 1, limit: res.length }
  }
  return {
    items: (res.items ?? []).map(mapSupplierFromApi),
    total: res.total ?? 0,
    page: res.page ?? 1,
    limit: res.limit ?? 10,
  }
}

export async function uploadSupplierDocument(file) {
  const formData = new FormData()
  formData.append('file', file)
  const { url } = await api.upload('/uploads/supplier-document', formData)
  return url
}
