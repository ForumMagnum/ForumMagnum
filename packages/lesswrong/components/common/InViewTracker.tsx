import React, { useEffect, useRef } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';


const InViewTracker = ({onVisible, onHidden, children}: {
  onVisible: ()=>void,
  onHidden: ()=>void,
  children: React.ReactNode
}) => {
  const trackedElementRef = useRef<HTMLSpanElement|null>(null);
  const isVisible = useRef(false);

  useEffect(() => {
    if (!window.IntersectionObserver) return
    
    const viewportHeight = window.innerHeight;
    const centerLineY = Math.floor(viewportHeight/3);
    const rootMargin = `-${centerLineY}px 0px -${viewportHeight-centerLineY-1}px 0px`;

    const observer = new window.IntersectionObserver(
      ([ entry ]) => {
        if(entry.isIntersecting !== isVisible.current) {
          isVisible.current = entry.isIntersecting;
          if(entry.isIntersecting) {
            onVisible();
          } else {
            onHidden();
          }
        }
      },
      {
        rootMargin: rootMargin,
        threshold: 0.0
      }
    )

    const node = trackedElementRef.current;
    if (node) observer.observe(node)
    return () => observer.disconnect()
  // eslint incorrectly thinks trackedElementRef.current isn't a dependency
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackedElementRef.current, onHidden, onVisible])

  return <span ref={trackedElementRef}>
    {children}
  </span>
}


const InViewTrackerComponent = registerComponent('InViewTracker', InViewTracker)

declare global {
  interface ComponentTypes {
    InViewTracker: typeof InViewTrackerComponent
  }
}
