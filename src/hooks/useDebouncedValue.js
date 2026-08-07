import { useEffect, useState } from 'react'

/**
 * The settled value of something that changes as fast as a person types.
 *
 * List screens send their search box to the server now, so every keystroke
 * would otherwise be a query against a table in the lakhs. The input itself
 * stays on the raw value — only the request waits.
 */
export function useDebouncedValue(value, delay = 350) {
  const [settled, setSettled] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return settled
}

export default useDebouncedValue
