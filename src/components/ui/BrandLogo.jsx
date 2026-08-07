/**
 * BrandLogo
 * Renders the official transparent logo from the public folder (Logo-removebg-preview.png)
 */
export default function BrandLogo({ height = 40, className = '', variant: _variant }) {
  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ height }}
    >
      <img
        src="/logo.png"
        alt="Herbal Gujarat"
        style={{
          height: '100%',
          width: 'auto',
          objectFit: 'contain',
        }}
      />
    </span>
  )
}
