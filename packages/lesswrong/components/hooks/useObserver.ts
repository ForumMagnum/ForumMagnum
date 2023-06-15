import { RefObject, useRef, useEffect } from "react";

export type UseObserverProps = {
  /**
   * The callback to run when the element enters the viewport.
   */
  onEnter?: () => void,
  /**
   * The callback to run when the element exits the viewport.
   */
  onExit?: () => void,
  /**
   * The amount of the element that must be visible to trigger the callback. 1 means
   * the entire element must be visible (be careful on mobile) and 0 will trigger if
   * at least 1px is visible. 0.5 would require half the element to be visible.
   * See https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API
   */
  threshold?: number|number[],
  /**
   * The maximum number of times the callback may be called. A negative value allows
   * an infinite number of calls. Note that this is tracked separately for `onEnter`
   * and `onExit` so when `maxTriggers` is 1 both callbacks can be triggered once
   * each.
   */
  maxTriggers?: number,
}

/**
 * useObserver is used to run a callback when a certain element enters and/or exits
 * the viewport. If the element is rendered above the fold to begin with then the
 * callback will run immediately after the first render.
 */
export const useObserver = <T extends Element>({
  onEnter,
  onExit,
  threshold = 0.8,
  maxTriggers = -1,
}: UseObserverProps): RefObject<T> => {
  const enterTriggerCount = useRef(0);
  const exitTriggerCount = useRef(0);
  const ref = useRef<T>(null);
  useEffect(() => {
    const target = ref.current;
    if (target) {
      const observer = new IntersectionObserver(
        ([{isIntersecting}]) => {
          if (isIntersecting) {
            if (maxTriggers < 0 || enterTriggerCount.current < maxTriggers) {
              enterTriggerCount.current++;
              onEnter?.();
            }
          } else if (maxTriggers < 0 || exitTriggerCount.current < maxTriggers) {
            exitTriggerCount.current++;
            onExit?.();
          }
        },
        {threshold},
      );
      observer.observe(target);
      return () => observer.unobserve(target);
    }
  }, [ref, onEnter, onExit, threshold, maxTriggers]);
  return ref;
}
