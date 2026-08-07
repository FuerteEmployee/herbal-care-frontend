import { useEffect, useState } from 'react'
import PurchaseOrderTable from './PurchaseOrderTable'
import { getPurchaseHistory } from '../../../api/purchase.api'

export default function PurchaseHistoryView() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getPurchaseHistory().then((data) => {
      setOrders(data)
      setLoading(false)
    })
  }, [])

  return (
    <PurchaseOrderTable
      data={orders}
      loading={loading}
      isHistory={true}
      emptyTitle="No purchase history"
      emptyMessage="Received purchase orders will appear here."
    />
  )
}
