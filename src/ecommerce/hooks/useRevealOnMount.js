import { useEffect } from 'react';

/**
 * Port of main.js's scroll-reveal behavior: any `.reveal` element inside the
 * given ref gets `.is-in` added once it scrolls into view (one-shot).
 *
 * `deps` is only for callers that mount some of their `.reveal` content after
 * their own first render (Home defers everything below the hero to keep the
 * very first paint cheap — see Home.jsx) — the effect re-queries `.reveal`
 * and re-observes whenever one of these changes, so elements that didn't
 * exist yet on the first pass still get picked up. Every other caller mounts
 * all of its `.reveal` elements upfront and can leave this at its default.
 */
export function useRevealOnMount(rootRef, deps = []) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const revealItems = root.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) {
      revealItems.forEach((item) => item.classList.add('is-in'));
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -60px' },
    );

    revealItems.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rootRef, ...deps]);
}
