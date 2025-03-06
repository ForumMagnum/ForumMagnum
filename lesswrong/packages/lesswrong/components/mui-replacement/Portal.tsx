import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface PortalProps {
  children: React.ReactNode;
  container?: Element | (() => Element | null) | null;
  disablePortal?: boolean;
  [key: string]: any; // For any other props
}

const Portal = ({
  children,
  container,
  disablePortal = false,
  ...rest
}: PortalProps) => {
  const [mountNode, setMountNode] = useState<Element | null>(null);

  useEffect(() => {
    if (disablePortal) {
      return;
    }

    let resolvedContainer: Element | null = null;

    if (container) {
      if (typeof container === 'function') {
        resolvedContainer = container();
      } else {
        resolvedContainer = container;
      }
    } else {
      resolvedContainer = document.body;
    }

    setMountNode(resolvedContainer);

    return () => {
      setMountNode(null);
    };
  }, [container, disablePortal]);

  if (disablePortal) {
    return <>{children}</>;
  }

  if (mountNode === null) {
    return null;
  }

  return createPortal(children, mountNode);
};

export default Portal; 