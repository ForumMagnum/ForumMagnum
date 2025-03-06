import React, { useEffect, useRef, useState } from 'react';

interface SwipeableDrawerProps {
  children: React.ReactNode;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  anchor?: 'left' | 'right' | 'top' | 'bottom';
  disableSwipeToOpen?: boolean;
  swipeAreaWidth?: number;
  hysteresis?: number;
  minFlingVelocity?: number;
  className?: string;
  style?: React.CSSProperties;
  [key: string]: any; // For any other props
}

/**
 * Simple replacement for Material-UI SwipeableDrawer component
 */
const SwipeableDrawer = ({
  children,
  open,
  onOpen,
  onClose,
  anchor = 'left',
  disableSwipeToOpen = false,
  swipeAreaWidth = 20,
  hysteresis = 0.52,
  minFlingVelocity = 450,
  className = '',
  style = {},
  ...rest
}: SwipeableDrawerProps) => {
  const [isOpen, setIsOpen] = useState(open);
  const drawerRef = useRef<HTMLDivElement>(null);
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const currentX = useRef<number | null>(null);
  const currentY = useRef<number | null>(null);
  const velocity = useRef<number>(0);
  const lastTime = useRef<number | null>(null);
  const isSwiping = useRef<boolean>(false);

  // Update open state when prop changes
  useEffect(() => {
    setIsOpen(open);
  }, [open]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        drawerRef.current &&
        !drawerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Handle swipe gestures
  useEffect(() => {
    if (disableSwipeToOpen) return;

    const handleTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      startX.current = touch.clientX;
      startY.current = touch.clientY;
      currentX.current = touch.clientX;
      currentY.current = touch.clientY;
      lastTime.current = Date.now();
      isSwiping.current = true;
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (!isSwiping.current) return;

      const touch = event.touches[0];
      const now = Date.now();
      const deltaX = touch.clientX - (currentX.current || 0);
      const deltaY = touch.clientY - (currentY.current || 0);
      const deltaTime = now - (lastTime.current || 0);

      // Calculate velocity in pixels per second
      if (deltaTime > 0) {
        velocity.current = Math.abs(deltaX) / deltaTime * 1000;
      }

      currentX.current = touch.clientX;
      currentY.current = touch.clientY;
      lastTime.current = now;

      // Determine if swipe is horizontal
      const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY);

      // Handle swipe based on anchor
      if (isHorizontalSwipe) {
        if (anchor === 'left' && !isOpen && currentX.current < swipeAreaWidth) {
          // Swipe from left edge to open
          if (deltaX > 0) {
            event.preventDefault();
          }
        } else if (anchor === 'right' && !isOpen && window.innerWidth - currentX.current < swipeAreaWidth) {
          // Swipe from right edge to open
          if (deltaX < 0) {
            event.preventDefault();
          }
        } else if (isOpen) {
          // Swipe to close
          if ((anchor === 'left' && deltaX < 0) || (anchor === 'right' && deltaX > 0)) {
            event.preventDefault();
          }
        }
      }
    };

    const handleTouchEnd = (event: TouchEvent) => {
      if (!isSwiping.current) return;
      isSwiping.current = false;

      if (!startX.current || !currentX.current) return;

      const deltaX = currentX.current - startX.current;
      const threshold = window.innerWidth * hysteresis;

      // Determine if swipe should trigger open/close
      if (anchor === 'left') {
        if (!isOpen && deltaX > threshold) {
          onOpen();
        } else if (isOpen && -deltaX > threshold) {
          onClose();
        } else if (velocity.current > minFlingVelocity) {
          if (!isOpen && deltaX > 0) {
            onOpen();
          } else if (isOpen && deltaX < 0) {
            onClose();
          }
        }
      } else if (anchor === 'right') {
        if (!isOpen && -deltaX > threshold) {
          onOpen();
        } else if (isOpen && deltaX > threshold) {
          onClose();
        } else if (velocity.current > minFlingVelocity) {
          if (!isOpen && deltaX < 0) {
            onOpen();
          } else if (isOpen && deltaX > 0) {
            onClose();
          }
        }
      }

      // Reset values
      startX.current = null;
      startY.current = null;
      currentX.current = null;
      currentY.current = null;
      lastTime.current = null;
      velocity.current = 0;
    };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [anchor, disableSwipeToOpen, hysteresis, isOpen, minFlingVelocity, onClose, onOpen, swipeAreaWidth]);

  // Drawer position based on anchor
  const getDrawerPosition = () => {
    switch (anchor) {
      case 'left':
        return {
          top: 0,
          left: 0,
          height: '100%',
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)'
        };
      case 'right':
        return {
          top: 0,
          right: 0,
          height: '100%',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)'
        };
      case 'top':
        return {
          top: 0,
          left: 0,
          width: '100%',
          transform: isOpen ? 'translateY(0)' : 'translateY(-100%)'
        };
      case 'bottom':
        return {
          bottom: 0,
          left: 0,
          width: '100%',
          transform: isOpen ? 'translateY(0)' : 'translateY(100%)'
        };
      default:
        return {};
    }
  };

  // Basic styling based on props
  const baseStyle: React.CSSProperties = {
    position: 'fixed',
    zIndex: 1200,
    backgroundColor: '#fff',
    boxShadow: '0px 8px 10px -5px rgba(0,0,0,0.2), 0px 16px 24px 2px rgba(0,0,0,0.14), 0px 6px 30px 5px rgba(0,0,0,0.12)',
    transition: 'transform 225ms cubic-bezier(0, 0, 0.2, 1) 0ms',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    ...getDrawerPosition(),
    ...style
  };

  // Backdrop style
  const backdropStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1199,
    opacity: isOpen ? 1 : 0,
    visibility: isOpen ? 'visible' : 'hidden',
    transition: 'opacity 225ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, visibility 225ms cubic-bezier(0.4, 0, 0.2, 1) 0ms'
  };

  return (
    <>
      <div style={backdropStyle} onClick={onClose} />
      <div
        ref={drawerRef}
        className={`mui-replacement-swipeable-drawer ${className}`}
        style={baseStyle}
        {...rest}
      >
        {children}
      </div>
    </>
  );
};

export default SwipeableDrawer; 