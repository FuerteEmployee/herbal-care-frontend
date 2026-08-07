import { api } from './httpClient'

function idOf(ref) {
  if (!ref) return ''
  return typeof ref === 'string' ? ref : ref._id
}

export function mapSupplierInvoiceFromApi(inv) {
  return {
    id: inv._id,
    invoiceNumber: inv.invoiceNumber ?? '',
    poNumber: inv.purchaseOrder?.poNumber ?? '',
    purchaseOrderId: idOf(inv.purchaseOrder),
    supplierId: idOf(inv.supplier),
    supplierName: inv.supplier?.name ?? '',
    invoiceDate: (inv.invoiceDate ?? inv.createdAt ?? '').slice(0, 10),
    paymentDueDate: (inv.paymentDueDate ?? '').slice(0, 10),
    items: inv.items ?? [],
    subtotal: inv.subtotal ?? 0,
    cgst: inv.cgst ?? 0,
    sgst: inv.sgst ?? 0,
    igst: inv.igst ?? 0,
    grandTotal: inv.grandTotal ?? inv.total ?? 0,
    paymentStatus: inv.paymentStatus ?? 'pending',
    amountPaid: inv.amountPaid ?? 0,
    notes: inv.notes ?? '',
  }
}

function toQuery(params = {}) {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== '') qs.set(k, v)
  })
  return qs.toString()
}

export async function getSupplierInvoices(params = {}) {
  const qs = toQuery(params)
  return (await api.get(`/supplier-invoices${qs ? `?${qs}` : ''}`)).map(mapSupplierInvoiceFromApi)
}

export async function getSupplierInvoiceById(id) {
  return mapSupplierInvoiceFromApi(await api.get(`/supplier-invoices/${id}`))
}

export async function createSupplierInvoice(data) {
  const created = await api.post('/supplier-invoices', {
    purchaseOrder: data.purchaseOrderId,
    supplier: data.supplierId,
    items: data.items,
    interState: data.interState ?? false,
    paymentDueDate: data.paymentDueDate || undefined,
    notes: data.notes || undefined,
  })
  return mapSupplierInvoiceFromApi(created)
}

export async function updatePaymentStatus(id, paymentStatus, amountPaid) {
  const updated = await api.put(`/supplier-invoices/${id}/payment-status`, { paymentStatus, amountPaid })
  return mapSupplierInvoiceFromApi(updated)
}

export async function deleteSupplierInvoice(id) {
  return api.delete(`/supplier-invoices/${id}`)
}
