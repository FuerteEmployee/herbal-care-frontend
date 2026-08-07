import { ShieldAlert } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function AccessRestricted({ page = 'this page' }) {
  const { user } = useAuth()
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500">
        <ShieldAlert size={26} />
      </span>
      <h2 className="mt-4 text-lg font-semibold text-slate-800">403 — Access Denied</h2>
      <p className="mt-1 max-w-sm text-sm text-slate-500">You do not have permission to access this page.</p>
      <p className="mt-1 max-w-sm text-xs text-slate-400">
        The <strong>{user?.roleName}</strong> role does not include access to {page}. Contact your Super Admin if you need it.
      </p>
    </div>
  )
}
