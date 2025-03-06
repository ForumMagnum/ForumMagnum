import React, { useEffect, useRef, useState } from 'react';

interface CollapseProps {
  children: React.ReactNode;
  in?: boolean;
  timeout?: number | { enter?: number; exit?: number };
  collapsedHeight?: string | number;
  className?: string;
  style?: React.CSSProperties;
  [key: string]: any; // For any other props
}

/**
 * Simple replacement for Material-UI Collapse component
 */
const Collapse = ({
  children,
  in: inProp = false,
  timeout = 300,
  collapsedHeight = '0px',
  className = '',
  style = {},
  ...rest
}: CollapseProps) => {
  const [height, setHeight] = useState<string | number>(inProp ? 'auto' : collapsedHeight);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get enter and exit durations
  const getTimeouts = () => {
    if (typeof timeout === 'number') {
      return {
        enter: timeout,
        exit: timeout
      };
    }
    return {
      enter: timeout.enter || 300,
      exit: timeout.exit || 300
    };
  };

  // Handle transition when in prop changes
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    const { enter, exit } = getTimeouts();

    if (inProp) {
      // Expanding
      setIsTransitioning(true);
      setHeight(contentRef.current?.scrollHeight || 'auto');
      
      timeoutRef.current = setTimeout(() => {
        setHeight('auto');
        setIsTransitioning(false);
      }, enter);
    } else {
      // Collapsing
      if (height === 'auto') {
        // Need to set a fixed height first to enable transition
        setHeight(contentRef.current?.scrollHeight || 0);
        
        // Force a reflow to make sure the browser registers the height change
        contentRef.current?.offsetHeight;
      }
      
      setIsTransitioning(true);
      setHeight(collapsedHeight);
      
      timeoutRef.current = setTimeout(() => {
        setIsTransitioning(false);
      }, exit);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [inProp, collapsedHeight]);

  // Basic styling based on props
  const containerStyle: React.CSSProperties = {
    height,
    overflow: isTransitioning ? 'hidden' : height === 'auto' ? 'visible' : 'hidden',
    transition: isTransitioning 
      ? `height ${getTimeouts()[inProp ? 'enter' : 'exit']}ms cubic-bezier(0.4, 0, 0.2, 1)` 
      : 'none',
    ...style
  };

  return (
    <div
      className={`mui-replacement-collapse ${className}`}
      style={containerStyle}
      {...rest}
    >
      <div ref={contentRef}>
        {children}
      </div>
    </div>
  );
};

export default Collapse; 