import React, { useEffect, useRef } from 'react';
import { PopperPlacementType } from './types';

interface PopoverProps {
  children: React.ReactNode;
  open: boolean;
  onClose?: (event: React.MouseEvent<Document>) => void;
  anchorEl?: HTMLElement | null;
  className?: string;
  style?: React.CSSProperties;
  anchorOrigin?: {
    vertical: 'top' | 'center' | 'bottom';
    horizontal: 'left' | 'center' | 'right';
  };
  transformOrigin?: {
    vertical: 'top' | 'center' | 'bottom';
    horizontal: 'left' | 'center' | 'right';
  };
  placement?: PopperPlacementType;
  [key: string]: any; // For any other props
}

/**
 * Simple replacement for Material-UI Popover component
 */
const Popover = ({
  children,
  open,
  onClose,
  anchorEl,
  className = '',
  style = {},
  anchorOrigin = { vertical: 'bottom', horizontal: 'left' },
  transformOrigin = { vertical: 'top', horizontal: 'left' },
  placement,
  ...rest
}: PopoverProps) => {
  const popoverRef = useRef<HTMLDivElement>(null);

  // Calculate position based on anchorEl and origins
  const getPopoverPosition = () => {
    if (!anchorEl) return { top: 0, left: 0 };

    const anchorRect = anchorEl.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

    let top = 0;
    let left = 0;

    // If placement is provided, use it instead of anchorOrigin/transformOrigin
    if (placement) {
      // Convert placement to anchor and transform origins
      const [vertical, horizontal] = placement.split('-') as ['top' | 'bottom' | 'left' | 'right', 'start' | 'end' | undefined];
      
      if (vertical === 'top') {
        top = anchorRect.top + scrollTop;
        transformOrigin.vertical = 'bottom';
      } else if (vertical === 'bottom') {
        top = anchorRect.bottom + scrollTop;
        transformOrigin.vertical = 'top';
      } else if (vertical === 'left') {
        left = anchorRect.left + scrollLeft;
        transformOrigin.horizontal = 'right';
      } else if (vertical === 'right') {
        left = anchorRect.right + scrollLeft;
        transformOrigin.horizontal = 'left';
      }

      if (horizontal === 'start') {
        if (vertical === 'top' || vertical === 'bottom') {
          left = anchorRect.left + scrollLeft;
          transformOrigin.horizontal = 'left';
        } else {
          top = anchorRect.top + scrollTop;
          transformOrigin.vertical = 'top';
        }
      } else if (horizontal === 'end') {
        if (vertical === 'top' || vertical === 'bottom') {
          left = anchorRect.right + scrollLeft;
          transformOrigin.horizontal = 'right';
        } else {
          top = anchorRect.bottom + scrollTop;
          transformOrigin.vertical = 'bottom';
        }
      }
    } else {
      // Use anchorOrigin
      // Vertical positioning
      if (anchorOrigin.vertical === 'top') {
        top = anchorRect.top + scrollTop;
      } else if (anchorOrigin.vertical === 'center') {
        top = anchorRect.top + scrollTop + anchorRect.height / 2;
      } else if (anchorOrigin.vertical === 'bottom') {
        top = anchorRect.bottom + scrollTop;
      }

      // Horizontal positioning
      if (anchorOrigin.horizontal === 'left') {
        left = anchorRect.left + scrollLeft;
      } else if (anchorOrigin.horizontal === 'center') {
        left = anchorRect.left + scrollLeft + anchorRect.width / 2;
      } else if (anchorOrigin.horizontal === 'right') {
        left = anchorRect.right + scrollLeft;
      }
    }

    // Apply transform origin
    if (popoverRef.current) {
      const popoverRect = popoverRef.current.getBoundingClientRect();
      
      if (transformOrigin.vertical === 'top') {
        // No adjustment needed
      } else if (transformOrigin.vertical === 'center') {
        top -= popoverRect.height / 2;
      } else if (transformOrigin.vertical === 'bottom') {
        top -= popoverRect.height;
      }

      if (transformOrigin.horizontal === 'left') {
        // No adjustment needed
      } else if (transformOrigin.horizontal === 'center') {
        left -= popoverRect.width / 2;
      } else if (transformOrigin.horizontal === 'right') {
        left -= popoverRect.width;
      }
    }

    return { top, left };
  };

  // Handle click outside to close popover
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        open &&
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        anchorEl &&
        !anchorEl.contains(event.target as Node) &&
        onClose
      ) {
        onClose(event as unknown as React.MouseEvent<Document>);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open, anchorEl, onClose]);

  // Don't render if not open
  if (!open) return null;

  // Get position
  const { top, left } = getPopoverPosition();

  // Basic styling based on props
  const baseStyle: React.CSSProperties = {
    position: 'absolute',
    top,
    left,
    backgroundColor: '#fff',
    borderRadius: '4px',
    boxShadow: '0px 5px 5px -3px rgba(0,0,0,0.2), 0px 8px 10px 1px rgba(0,0,0,0.14), 0px 3px 14px 2px rgba(0,0,0,0.12)',
    zIndex: 1300,
    ...style
  };

  return (
    <div
      ref={popoverRef}
      className={`mui-replacement-popover ${className}`}
      style={baseStyle}
      role="presentation"
      {...rest}
    >
      {children}
    </div>
  );
};

export default Popover; 