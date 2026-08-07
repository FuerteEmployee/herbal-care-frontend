import { Trash2 } from 'lucide-react'
import { SelectField, TextField } from '../../../components/ui/FormField'

// Single product/qty/price row within CreatePurchaseForm's line-item list.
export default function PurchaseLineItemRow({ item, index, productOptions, onChange, onRemove, canRemove }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50/60 p-3">
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <SelectField
            label={index === 0 ? 'Product' : undefined}
            options={productOptions}
            value={item.productId}
            onChange={(e) => onChange(index, 'productId', e.target.value)}
          />
        </div>
        <div className="w-28">
          <TextField
            label={index === 0 ? 'Qty' : undefined}
            type="number"
            min="1"
            value={item.qty}
            onChange={(e) => onChange(index, 'qty', e.target.value)}
          />
        </div>
        <div className="w-32">
          <TextField
            label={index === 0 ? 'Price (₹)' : undefined}
            type="number"
            min="0"
            value={item.price}
            onChange={(e) => onChange(index, 'price', e.target.value)}
          />
        </div>
        <div className="w-24">
          <TextField
            label={index === 0 ? 'GST %' : undefined}
            type="number"
            min="0"
            value={item.gstPercent}
            onChange={(e) => onChange(index, 'gstPercent', e.target.value)}
          />
        </div>
        <button
          type="button"
          onClick={() => onRemove(index)}
          disabled={!canRemove}
          className="mb-0.5 shrink-0 rounded-md p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3 border-t border-slate-100 pt-2">
        <TextField
          label="GSM"
          placeholder="e.g. 70 GSM"
          value={item.gsm ?? ''}
          onChange={(e) => onChange(index, 'gsm', e.target.value)}
        />
        <TextField
          label="Page Count"
          type="number"
          min="0"
          placeholder="e.g. 200"
          value={item.pageCount ?? ''}
          onChange={(e) => onChange(index, 'pageCount', e.target.value)}
        />
        <TextField
          label="Paper Size"
          placeholder="e.g. A4, A5"
          value={item.paperSize ?? ''}
          onChange={(e) => onChange(index, 'paperSize', e.target.value)}
        />
        <TextField
          label="Ink/Color"
          placeholder="e.g. Blue, Black"
          value={item.color ?? ''}
          onChange={(e) => onChange(index, 'color', e.target.value)}
        />
      </div>
    </div>
  )
}
