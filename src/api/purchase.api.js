import { api } from './httpClient'

function idOf(ref) {
  if (!ref) return ''
  return typeof ref === 'string' ? ref : ref._id
}

export function mapPurchaseOrderFromApi(po) {
  return {
    id: po._id,
    poNumber: po.poNumber ?? po._id,
    supplierId: idOf(po.supplier),
    supplier: po.supplier && typeof po.supplier === 'object' ? po.supplier : null,
    status: po.status ?? 'draft',
    orderDate: (po.orderDate ?? po.createdAt ?? '').slice(0, 10),
    expectedDelivery: (po.expectedDelivery ?? '').slice(0, 10),
    warehouseId: idOf(po.warehouse),
    interState: po.interState ?? false,
    items: (po.items ?? []).map((i) => ({
      id: i._id,
      product: i.product,
      name: i.name ?? (i.product?.name ?? ''),
      qty: i.qty,
      price: i.price,
      gstPercent: i.gstPercent ?? 0,
      gsm: i.gsm,
      pageCount: i.pageCount,
      paperSize: i.paperSize,
      color: i.color,
    })),
    subtotal: po.subtotal ?? 0,
    cgst: po.cgst ?? 0,
    sgst: po.sgst ?? 0,
    igst: po.igst ?? 0,
    grandTotal: po.grandTotal ?? po.total ?? 0,
    total: po.grandTotal ?? po.total ?? 0,
    notes: po.notes ?? '',
  }
}

export async function getPurchaseOrders() {
  return (await api.get('/purchase')).map(mapPurchaseOrderFromApi)
}

export async function getPendingPurchaseOrders() {
  return (await api.get('/purchase/pending')).map(mapPurchaseOrderFromApi)
}

export async function getPurchaseHistory() {
  return (await api.get('/purchase/history')).map(mapPurchaseOrderFromApi)
}

export async function getSupplierOrders(supplierId) {
  return (await api.get(`/purchase?supplier=${supplierId}`)).map(mapPurchaseOrderFromApi)
}

export async function createPurchaseOrder(data) {
  const po = await api.post('/purchase', {
    supplier: data.supplierId,
    warehouse: data.warehouseId,
    expectedDelivery: data.expectedDelivery || undefined,
    interState: data.interState ?? false,
    items: data.items.map((i) => ({
      product: i.productId,
      qty: Number(i.qty),
      price: Number(i.price),
      gstPercent: Number(i.gstPercent) || 0,
    })),
    notes: data.notes || undefined,
  })
  return mapPurchaseOrderFromApi(po)
}

export async function updatePurchaseOrder(id, data) {
  const po = await api.put(`/purchase/${id}`, {
    supplier: data.supplierId,
    warehouse: data.warehouseId,
    expectedDelivery: data.expectedDelivery || undefined,
    interState: data.interState ?? false,
    items: data.items.map((i) => ({
      product: i.productId,
      qty: Number(i.qty),
      price: Number(i.price),
      gstPercent: Number(i.gstPercent) || 0,
    })),
    notes: data.notes || undefined,
  })
  return mapPurchaseOrderFromApi(po)
}

export async function deletePurchaseOrder(id) {
  return api.delete(`/purchase/${id}`)
}

export async function updatePurchaseOrderStatus(id, status) {
  const po = await api.put(`/purchase/${id}/status`, { status })
  return mapPurchaseOrderFromApi(po)
}

export async function getPurchaseInvoicePrintData(id) {
  return api.get(`/purchase/${id}/invoice`)
}
