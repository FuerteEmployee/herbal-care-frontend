import { useEffect, useRef, useState } from 'react';

/**
 * Autoplaying slider: swipe navigation, and manual dot/arrow navigation that
 * restarts the autoplay clock.
 *
 * `pauseOnHover` is off by default and deliberately so. The hero fills the
 * viewport, so any mouse resting over it — which is most of the time on
 * desktop — used to stop autoplay indefinitely and made the slider look
 * broken. Autoplay still pauses mid-swipe, where the user is clearly driving.
 */
export function useSlider(count, intervalMs, { pauseOnHover = false } = {}) {
  const [index, setIndex] = useState(0);
  const pausedRef = useRef(false);
  const touchStartX = useRef(null);

  function goTo(next) {
    setIndex(((next % count) + count) % count);
  }
  function next() {
    goTo(index + 1);
  }
  function prev() {
    goTo(index - 1);
  }

  useEffect(() => {
    if (!intervalMs) return undefined;
    const timer = window.setInterval(() => {
      if (!pausedRef.current) setIndex((i) => (i + 1) % count);
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [count, intervalMs, index]);

  const sliderProps = {
    ...(pauseOnHover
      ? {
          onMouseEnter() {
            if (window.matchMedia('(hover: hover)').matches) {
              pausedRef.current = true;
            }
          },
          onMouseLeave() {
            if (window.matchMedia('(hover: hover)').matches) {
              pausedRef.current = false;
            }
          },
        }
      : {}),
    onTouchStart(event) {
      touchStartX.current = event.touches[0].clientX;
    },
    onTouchEnd(event) {
      pausedRef.current = false;
      if (touchStartX.current == null) return;
      const dx = event.changedTouches[0].clientX - touchStartX.current;
      touchStartX.current = null;
      if (Math.abs(dx) > 45) {
        if (dx < 0) next();
        else prev();
      }
    },
  };

  return { index, goTo, next, prev, sliderProps };
}
