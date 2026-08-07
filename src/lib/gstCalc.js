// Mirrors the Pentagon backend's utils/productGst.js formulas exactly, so the
// Add Product form's live preview matches what the server will actually
// store. The server is still the source of truth — it recomputes and
// overwrites these values independently on every create/update — this copy
// exists only to give the admin instant on-screen feedback.
export const GST_PERCENT_OPTIONS = ['0', '3', '5', '12', '18', '28']
export const GST_MODE_OPTIONS = [
  { value: 'exclusive', label: 'Exclusive (GST added on top)' },
  { value: 'inclusive', label: 'Inclusive (GST already included)' },
]

function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100
}

// If GST Mode = Exclusive, Product Price is the taxable base and Final
// Selling Price = Product Price + GST Amount. If GST Mode = Inclusive,
// Product Price already includes GST, so Taxable Amount is derived back out
// of it instead.
export function computeProductGst(productPrice, gstPercent, gstMode) {
  const priceInput = Number(productPrice) || 0
  const rate = Number(gstPercent) || 0
  const mode = gstMode === 'inclusive' ? 'inclusive' : 'exclusive'

  if (mode === 'inclusive') {
    const taxableAmount = round2(priceInput / (1 + rate / 100))
    const gstAmount = round2(priceInput - taxableAmount)
    return { taxableAmount, gstAmount, sellingPrice: round2(priceInput) }
  }

  const taxableAmount = round2(priceInput)
  const gstAmount = round2((taxableAmount * rate) / 100)
  return { taxableAmount, gstAmount, sellingPrice: round2(taxableAmount + gstAmount) }
}
