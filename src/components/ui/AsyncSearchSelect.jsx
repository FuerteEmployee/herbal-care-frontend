import { useEffect, useRef, useState } from 'react'
import { Search, ChevronDown } from 'lucide-react'

// Minimal async-search dropdown. `fetchOptions(search)` must return
// [{ value, label, sublabel? }]. Fires onChange(value) on selection.
export default function AsyncSearchSelect({
  label,
  placeholder = 'Search…',
  value,
  onChange,
  fetchOptions,
  disabled = false,
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [options, setOptions] = useState([])
  const [loading, setLoading] = useState(false)
  const [displayLabel, setDisplayLabel] = useState('')
  const containerRef = useRef(null)

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Load options on search change
  useEffect(() => {
    if (!open) return
    let cancelled = false
    setLoading(true)
    fetchOptions(search)
      .then((res) => { if (!cancelled) setOptions(res) })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [search, open, fetchOptions])

  function handleSelect(opt) {
    setDisplayLabel(opt.label)
    setSearch('')
    setOpen(false)
    onChange(opt.value)
  }

  return (
    <div ref={containerRef} className="form-field">
      {label && <label className="form-label">{label}</label>}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className="async-select-trigger"
      >
        <span className={displayLabel ? 'text-slate-800' : 'text-slate-400'}>
          {displayLabel || placeholder}
        </span>
        <ChevronDown size={14} className="text-slate-400" />
      </button>

      {open && (
        <div className="async-select-dropdown">
          <div className="async-select-search-wrap">
            <Search size={14} className="text-slate-400" />
            <input
              autoFocus
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Type to search…"
              className="async-select-search-input"
            />
          </div>
          <ul className="async-select-list">
            {loading && (
              <li className="async-select-item text-slate-400">Loading…</li>
            )}
            {!loading && options.length === 0 && (
              <li className="async-select-item text-slate-400">No results</li>
            )}
            {!loading && options.map((opt) => (
              <li
                key={opt.value}
                onClick={() => handleSelect(opt)}
                className={`async-select-item ${opt.value === value ? 'async-select-item-active' : ''}`}
              >
                <span className="font-medium">{opt.label}</span>
                {opt.sublabel && <span className="text-xs text-slate-400 ml-1">({opt.sublabel})</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
