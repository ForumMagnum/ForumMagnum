import React, { useEffect, useState } from 'react';

interface FadeProps {
  children: React.ReactNode;
  in?: boolean;
  timeout?: number | { enter?: number; exit?: number };
  className?: string;
  style?: React.CSSProperties;
  [key: string]: any; // For any other props
}

const Fade = ({
  children,
  in: inProp = false,
  timeout = 300,
  className = '',
  style = {},
  ...rest
}: FadeProps) => {
  const [state, setState] = useState<'entering' | 'entered' | 'exiting' | 'exited'>(
    inProp ? 'entered' : 'exited'
  );
  const [opacity, setOpacity] = useState(inProp ? 1 : 0);

  const getTimeouts = () => {
    const enterTimeout = typeof timeout === 'number' ? timeout : (timeout.enter || 300);
    const exitTimeout = typeof timeout === 'number' ? timeout : (timeout.exit || 300);
    
    return { enter: enterTimeout, exit: exitTimeout };
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (inProp) {
      setState('entering');
      setOpacity(0);
      
      // Force a reflow to make the transition work
      document.body.offsetHeight; // eslint-disable-line no-unused-expressions
      
      timer = setTimeout(() => {
        setOpacity(1);
        setState('entered');
      }, 10);
    } else {
      setState('exiting');
      setOpacity(0);
      
      timer = setTimeout(() => {
        setState('exited');
      }, getTimeouts().exit);
    }
    
    return () => {
      clearTimeout(timer);
    };
  }, [inProp]);

  if (state === 'exited' && !inProp) {
    return null;
  }

  const fadeStyles: React.CSSProperties = {
    opacity,
    transition: `opacity ${getTimeouts().enter}ms cubic-bezier(0.4, 0, 0.2, 1)`,
    ...style,
  };

  return (
    <div
      className={`mui-fade ${className}`}
      style={fadeStyles}
      {...rest}
    >
      {children}
    </div>
  );
};

export default Fade; 