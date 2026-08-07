import { useEffect, useState } from 'react'
import { SelectField } from '../../../components/ui/FormField'
import PurchaseOrderTable from './PurchaseOrderTable'
import { getPurchaseOrders, getSupplierOrders } from '../../../api/purchase.api'
import { getSuppliers } from '../../../api/suppliers.api'

// Supplier Orders tab: defaults to all purchase orders, filters to one
// supplier's orders when selected.
export default function SupplierOrdersView() {
  const [suppliers, setSuppliers] = useState([])
  const [supplierId, setSupplierId] = useState('')
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    getSuppliers().then(setSuppliers)
  }, [])

  useEffect(() => {
    setLoading(true)
    const request = supplierId ? getSupplierOrders(supplierId) : getPurchaseOrders()
    request.then((data) => {
      setOrders(data)
      setLoading(false)
    })
  }, [supplierId, refreshKey])

  const supplierOptions = suppliers.map((s) => ({ value: s.id, label: s.name }))

  return (
    <div className="space-y-4">
      <div className="max-w-xs">
        <SelectField
          label="Filter by Supplier"
          placeholder="All suppliers"
          options={supplierOptions}
          value={supplierId}
          onChange={(e) => setSupplierId(e.target.value)}
        />
      </div>
      <PurchaseOrderTable
        data={orders}
        loading={loading}
        emptyTitle="No orders found"
        emptyMessage="This supplier has no purchase orders yet."
        onChanged={() => setRefreshKey((k) => k + 1)}
      />
    </div>
  )
}
