import { useAuth } from '../context/AuthContext'

// const { can } = usePermission(); if (can('products.delete')) { ... }
export function usePermission() {
  const { hasPermission } = useAuth()
  return { can: hasPermission }
}
