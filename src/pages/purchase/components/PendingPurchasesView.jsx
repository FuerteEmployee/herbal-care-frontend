import { useEffect, useState } from 'react'
import PurchaseOrderTable from './PurchaseOrderTable'
import { getPendingPurchaseOrders } from '../../../api/purchase.api'

export default function PendingPurchasesView() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    setLoading(true)
    getPendingPurchaseOrders().then((data) => {
      setOrders(data)
      setLoading(false)
    })
  }, [refreshKey])

  return (
    <PurchaseOrderTable
      data={orders}
      loading={loading}
      emptyTitle="No pending purchases"
      emptyMessage="All purchase orders have been dispatched or received."
      onChanged={() => setRefreshKey((k) => k + 1)}
    />
  )
}
