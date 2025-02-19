import { RefObject, useEffect, useRef, useState } from 'react';

export function useCheckMeritsCollapse<T extends HTMLElement>(
  {ref, height, deps}:
  {ref: RefObject<T>, height: number, deps?: any[]}
) {
  // this tracks whether the contents of the tab actually overflow
  const [meritsCollapse, setMeritsCollapse] = useState(false)
  const resizeObserver = useRef<ResizeObserver|null>(null)

  useEffect(() => {
    if (ref.current) {
      resizeObserver.current = new ResizeObserver(elements => {
        setMeritsCollapse(Math.round(elements[0].contentRect.height) >= height)
      })
      resizeObserver.current.observe(ref.current)
    }
    return () => resizeObserver.current?.disconnect()
  }, [ref, height, ...(deps ?? [])]) // eslint-disable-line react-hooks/exhaustive-deps

  return meritsCollapse
}
