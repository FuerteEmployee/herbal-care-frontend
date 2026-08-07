import { Plus } from 'lucide-react'
import { SelectField, TextField, TextAreaField } from '../../../components/ui/FormField'
import AsyncSearchSelect from '../../../components/ui/AsyncSearchSelect'
import { getWarehousesPage } from '../../../api/warehouse.api'
import PurchaseLineItemRow from './PurchaseLineItemRow'

async function fetchWarehouseOptions(search) {
  const { items } = await getWarehousesPage({ search, page: 1, limit: 10, status: 'active' })
  return items.map((w) => ({ value: w.id, label: w.name, sublabel: w.location }))
}

export const emptyPurchaseItem = () => ({ productId: '', qty: '', price: '', gstPercent: '', gsm: '', pageCount: '', paperSize: '', color: '' })

function computeTotals(items, interState) {
  let subtotal = 0
  let totalGst = 0
  items.forEach((item) => {
    const lineBase = (Number(item.qty) || 0) * (Number(item.price) || 0)
    const gst = lineBase * ((Number(item.gstPercent) || 0) / 100)
    subtotal += lineBase
    totalGst += gst
  })
  const cgst = interState ? 0 : totalGst / 2
  const sgst = interState ? 0 : totalGst / 2
  const igst = interState ? totalGst : 0
  return { subtotal, cgst, sgst, igst, grandTotal: subtotal + totalGst }
}

const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 })

// Shared supplier + line-items body used by both CreatePurchaseForm and
// EditPurchaseOrderModal, since the fields are identical either way.
export default function PurchaseOrderFormBody({
  supplierId,
  onSupplierChange,
  warehouseId,
  onWarehouseChange,
  items,
  onItemsChange,
  supplierOptions,
  productOptions,
  interState,
  onInterStateChange,
  expectedDeliveryDate,
  onExpectedDeliveryDateChange,
  notes,
  onNotesChange,
}) {
  function updateItem(index, field, value) {
    onItemsChange(
      items.map((item, i) => {
        if (i !== index) return item
        const next = { ...item, [field]: value }
        if (field === 'productId') {
          const product = productOptions.find((p) => p.value === value)
          if (product?.price != null) next.price = String(product.price)
        }
        return next
      })
    )
  }

  function addItem() {
    onItemsChange([...items, emptyPurchaseItem()])
  }

  function removeItem(index) {
    onItemsChange(items.filter((_, i) => i !== index))
  }

  const totals = computeTotals(items, interState)

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <SelectField label="Supplier" required options={supplierOptions} value={supplierId} onChange={(e) => onSupplierChange(e.target.value)} />
        <AsyncSearchSelect
          label="Warehouse"
          required
          value={warehouseId}
          onChange={onWarehouseChange}
          fetchOptions={fetchWarehouseOptions}
          placeholder="Select Warehouse..."
          searchPlaceholder="Search by name or code..."
          emptyLabel="No warehouses found"
        />
        <TextField
          label="Expected Delivery Date"
          type="date"
          value={expectedDeliveryDate}
          onChange={(e) => onExpectedDeliveryDateChange(e.target.value)}
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" checked={!!interState} onChange={(e) => onInterStateChange(e.target.checked)} />
        Inter-state purchase (IGST instead of CGST+SGST)
      </label>

      <div>
        <span className="mb-2 block text-sm font-medium text-slate-700">Line Items</span>
        <div className="space-y-3">
          {items.map((item, index) => (
            <PurchaseLineItemRow
              key={index}
              item={item}
              index={index}
              productOptions={productOptions}
              onChange={updateItem}
              onRemove={removeItem}
              canRemove={items.length > 1}
            />
          ))}
        </div>
        <button type="button" onClick={addItem} className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:text-primary-700">
          <Plus size={14} /> Add item
        </button>
      </div>

      <TextAreaField label="Notes" value={notes} onChange={(e) => onNotesChange(e.target.value)} rows={2} />

      <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 text-sm">
        <div className="flex justify-between text-slate-600">
          <span>Subtotal</span>
          <span className="tabular-nums">{currency.format(totals.subtotal)}</span>
        </div>
        {interState ? (
          <div className="flex justify-between text-slate-600">
            <span>IGST</span>
            <span className="tabular-nums">{currency.format(totals.igst)}</span>
          </div>
        ) : (
          <>
            <div className="flex justify-between text-slate-600">
              <span>CGST</span>
              <span className="tabular-nums">{currency.format(totals.cgst)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>SGST</span>
              <span className="tabular-nums">{currency.format(totals.sgst)}</span>
            </div>
          </>
        )}
        <div className="mt-1 flex justify-between border-t border-slate-200 pt-1 font-semibold text-slate-900">
          <span>Grand Total</span>
          <span className="tabular-nums">{currency.format(totals.grandTotal)}</span>
        </div>
      </div>
    </div>
  )
}
