import { useEffect } from 'react'

/*
 * Casual-copy deterrents for the storefront.
 *
 * WHAT THIS IS
 * ------------
 * A speed bump. It stops a visitor from right-clicking an image, dragging it to
 * the desktop, or sweeping the page and hitting Ctrl+C. That is the whole of
 * what browser-side protection can do.
 *
 * WHAT THIS IS NOT
 * ----------------
 * Security. Everything the page renders has already been delivered to the
 * visitor's machine, and nothing here changes that. Anyone who opens the
 * browser menu instead of pressing F12, disables JavaScript, reads the network
 * tab, or types the image URL into the address bar gets the content anyway. The
 * keyboard blocks below are the weakest part: F12 and Ctrl+Shift+I are handled
 * by the browser itself, and a page's preventDefault does not reliably stop
 * them opening DevTools at all.
 *
 * So: never rely on this for anything that actually needs protecting. Private
 * data belongs behind an authenticated backend route, not behind a keydown
 * handler — the admin API is the model, where every endpoint refuses without a
 * token regardless of what the frontend does.
 *
 * WHAT IS DELIBERATELY NOT HERE
 * -----------------------------
 * No DevTools *detection* — no `debugger` traps, no window-size polling, no
 * blanking the page when a panel opens. Those fire on people who never opened
 * DevTools (docked panels, zoomed browsers, accessibility tooling), burn a
 * timer forever, and are bypassed in seconds by anyone they were aimed at. The
 * cost lands on real customers and the benefit is theatre.
 *
 * SCOPE
 * -----
 * Storefront only. The admin panel is a separate document behind a login, its
 * content belongs to the people using it, and the team maintaining it needs
 * DevTools.
 */

// Where the browser's own editing behaviour must be left completely alone —
// typing, selecting, right-click-to-paste. This is the visitor's own data, not
// the site's content, so protecting it serves nobody.
const EDITABLE = 'input, textarea, select, [contenteditable="true"]'

/*
 * Opt-out for content a visitor legitimately needs to take away with them.
 *
 * The order reference on the checkout confirmation is the case that matters:
 * it is shown once and then has to be typed into the tracking form. Blocking
 * copy there does not protect anything — it just makes a paying customer
 * transcribe HG7K2M4P by hand and get it wrong.
 */
const COPYABLE = '.allow-select'

const EXEMPT = `${EDITABLE}, ${COPYABLE}`

/** Is this node inside something the visitor is allowed to select or copy? */
function isExempt(node) {
  if (!node) return false
  // A text node cannot answer closest() — ask its parent.
  const el = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement
  return !!el?.closest?.(EXEMPT)
}

/**
 * DevTools / view-source shortcuts.
 *
 * Matched narrowly so ordinary editing keys are never swallowed: Ctrl+C, Ctrl+V,
 * Ctrl+X, Ctrl+A and every single-modifier combination stay untouched, which is
 * what keeps checkout and the contact form usable.
 */
function isInspectShortcut(event) {
  const key = String(event.key || '').toLowerCase()
  if (key === 'f12') return true

  // Ctrl+Shift+I / J / C (Windows, Linux) and Cmd+Alt+I / J / C (macOS).
  const inspectKey = key === 'i' || key === 'j' || key === 'c'
  if (inspectKey && event.shiftKey && (event.ctrlKey || event.metaKey)) return true
  if (inspectKey && event.altKey && event.metaKey) return true

  // Ctrl+U / Cmd+U — view source. Guarded against Shift and Alt so it only
  // matches the real shortcut.
  if (key === 'u' && (event.ctrlKey || event.metaKey) && !event.shiftKey && !event.altKey) return true

  return false
}

/**
 * Install the deterrents for as long as the storefront is mounted.
 *
 * Everything is a delegated listener on `document` rather than a prop on each
 * element: it covers content that does not exist yet (route changes, API
 * results, the Google Translate widget rewriting the DOM) without a single
 * component having to know this exists.
 */
export function useContentProtection() {
  useEffect(() => {
    // Right-click. Left alone inside form fields, where the menu is how people
    // paste an address or a phone number — and where there is nothing of the
    // site's to protect anyway.
    function onContextMenu(event) {
      if (isExempt(event.target)) return
      event.preventDefault()
    }

    // Covers Ctrl+C, Cmd+C, the Edit menu and the context menu in one place —
    // all of them fire this event, so there is no need to guess at keystrokes.
    function onCopy(event) {
      if (isExempt(event.target)) return
      // A sweep of the page starts somewhere; if that somewhere is exempt, the
      // visitor is copying their own text and it is not ours to block.
      const selection = document.getSelection?.()
      if (isExempt(selection?.anchorNode)) return
      event.preventDefault()
    }

    // Dragging an image straight out of the page to a folder.
    function onDragStart(event) {
      if (event.target?.tagName === 'IMG') event.preventDefault()
    }

    function onKeyDown(event) {
      if (!isInspectShortcut(event)) return
      event.preventDefault()
    }

    document.addEventListener('contextmenu', onContextMenu)
    document.addEventListener('copy', onCopy)
    document.addEventListener('cut', onCopy)
    document.addEventListener('dragstart', onDragStart)
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('contextmenu', onContextMenu)
      document.removeEventListener('copy', onCopy)
      document.removeEventListener('cut', onCopy)
      document.removeEventListener('dragstart', onDragStart)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [])
}

export default useContentProtection
