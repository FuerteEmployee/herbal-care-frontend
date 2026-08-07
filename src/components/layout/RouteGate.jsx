import { useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { findNavItem } from '../../constants/roles'
import AccessRestricted from '../ui/AccessRestricted'

export default function RouteGate({ children }) {
  const { hasPermission } = useAuth()
  const location = useLocation()

  const item = findNavItem(location.pathname)
  const allowed = !item || !item.moduleKey || hasPermission(`${item.moduleKey}.view`)
  if (!allowed) return <AccessRestricted />
  return children
}
