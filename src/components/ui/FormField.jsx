import { Plus, Trash2, ChevronDown } from 'lucide-react'

const baseInput =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100 disabled:bg-slate-50 disabled:text-slate-400'

function FieldWrap({ label, required, hint, error, children }) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-sm font-medium text-slate-700">
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </span>
      )}
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-slate-400">{hint}</span>}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  )
}

export function TextField({ label, required, hint, error, className = '', ...props }) {
  return (
    <FieldWrap label={label} required={required} hint={hint} error={error}>
      <input className={`${baseInput} ${className}`} {...props} />
    </FieldWrap>
  )
}

export function TextAreaField({ label, required, hint, error, className = '', rows = 3, ...props }) {
  return (
    <FieldWrap label={label} required={required} hint={hint} error={error}>
      <textarea rows={rows} className={`${baseInput} resize-none ${className}`} {...props} />
    </FieldWrap>
  )
}

export function SelectField({ label, required, hint, error, options = [], placeholder = 'Select...', className = '', ...props }) {
  return (
    <FieldWrap label={label} required={required} hint={hint} error={error}>
      <div className="relative w-full flex items-center">
        <select className={`${baseInput} appearance-none pr-10 ${className}`} {...props}>
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown size={16} className="absolute right-3 pointer-events-none text-slate-500" />
      </div>
    </FieldWrap>
  )
}

export function MultiSelectField({ label, hint, options = [], value = [], onChange }) {
  function toggle(val) {
    if (value.includes(val)) onChange(value.filter((v) => v !== val))
    else onChange([...value, val])
  }

  return (
    <div>
      {label && <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>}
      <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto rounded-lg border border-slate-300 bg-white p-2 scrollbar-thin">
        {options.length === 0 && <span className="px-1 py-1 text-xs text-slate-400">No options available</span>}
        {options.map((opt) => {
          const active = value.includes(opt.value)
          return (
            <button
              type="button"
              key={opt.value}
              onClick={() => toggle(opt.value)}
              className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                active ? 'border-primary-600 bg-primary-600 text-white' : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
      {hint && <span className="mt-1 block text-xs text-slate-400">{hint}</span>}
    </div>
  )
}

export function KeyValueRows({ label, rows = [], onChange, keyPlaceholder = 'Key', valuePlaceholder = 'Value' }) {
  function updateRow(idx, field, val) {
    const next = rows.map((row, i) => (i === idx ? { ...row, [field]: val } : row))
    onChange(next)
  }

  function addRow() {
    onChange([...rows, { key: '', value: '' }])
  }

  function removeRow(idx) {
    onChange(rows.filter((_, i) => i !== idx))
  }

  return (
    <div>
      {label && <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>}
      <div className="space-y-2">
        {rows.map((row, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <input
              className={baseInput}
              placeholder={keyPlaceholder}
              value={row.key}
              onChange={(e) => updateRow(idx, 'key', e.target.value)}
            />
            <input
              className={baseInput}
              placeholder={valuePlaceholder}
              value={row.value}
              onChange={(e) => updateRow(idx, 'value', e.target.value)}
            />
            <button type="button" onClick={() => removeRow(idx)} className="shrink-0 rounded-md p-2 text-slate-400 hover:bg-red-50 hover:text-red-600">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={addRow}
        className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:text-primary-700"
      >
        <Plus size={14} /> Add row
      </button>
    </div>
  )
}
