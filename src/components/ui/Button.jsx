// Thin wrapper over the .btn classes in index.css so button styling lives in
// one place. `primary` is the only variant that fills with brand green — keep
// it for the single most important action on a screen. `danger` is outlined by
// default; `dangerSolid` is for the confirm step of a destructive flow.
const VARIANTS = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  danger: 'btn-danger',
  dangerSolid: 'btn-danger-solid',
  success: 'btn-success',
}

const SIZES = {
  xs: 'btn-xs',
  sm: 'btn-sm',
  md: '',
}

export default function Button({ variant = 'primary', size = 'md', className = '', children, ...props }) {
  return (
    <button
      className={`btn ${VARIANTS[variant] ?? VARIANTS.primary} ${SIZES[size] ?? ''} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  )
}
