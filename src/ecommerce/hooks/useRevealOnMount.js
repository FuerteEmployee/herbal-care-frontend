import { useEffect } from 'react';

/**
 * Port of main.js's scroll-reveal behavior: any `.reveal` element inside the
 * given ref gets `.is-in` added once it scrolls into view (one-shot).
 */
export function useRevealOnMount(rootRef) {
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
  }, [rootRef]);
}
