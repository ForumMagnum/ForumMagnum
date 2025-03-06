import React, { useEffect, useRef } from 'react';

interface MenuProps {
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
  [key: string]: any; // For any other props
}

/**
 * Simple replacement for Material-UI Menu component
 */
const Menu = ({
  children,
  open,
  onClose,
  anchorEl,
  className = '',
  style = {},
  anchorOrigin = { vertical: 'bottom', horizontal: 'left' },
  transformOrigin = { vertical: 'top', horizontal: 'left' },
  ...rest
}: MenuProps) => {
  const menuRef = useRef<HTMLDivElement>(null);

  // Calculate position based on anchorEl and origins
  const getMenuPosition = () => {
    if (!anchorEl) return { top: 0, left: 0 };

    const anchorRect = anchorEl.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

    let top = 0;
    let left = 0;

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

    // Apply transform origin
    if (menuRef.current) {
      const menuRect = menuRef.current.getBoundingClientRect();
      
      if (transformOrigin.vertical === 'top') {
        // No adjustment needed
      } else if (transformOrigin.vertical === 'center') {
        top -= menuRect.height / 2;
      } else if (transformOrigin.vertical === 'bottom') {
        top -= menuRect.height;
      }

      if (transformOrigin.horizontal === 'left') {
        // No adjustment needed
      } else if (transformOrigin.horizontal === 'center') {
        left -= menuRect.width / 2;
      } else if (transformOrigin.horizontal === 'right') {
        left -= menuRect.width;
      }
    }

    return { top, left };
  };

  // Handle click outside to close menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        open &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
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
  const { top, left } = getMenuPosition();

  // Basic styling based on props
  const baseStyle: React.CSSProperties = {
    position: 'absolute',
    top,
    left,
    backgroundColor: '#fff',
    borderRadius: '4px',
    boxShadow: '0px 5px 5px -3px rgba(0,0,0,0.2), 0px 8px 10px 1px rgba(0,0,0,0.14), 0px 3px 14px 2px rgba(0,0,0,0.12)',
    padding: '8px 0',
    zIndex: 1300,
    minWidth: '120px',
    maxHeight: 'calc(100% - 96px)',
    overflowY: 'auto',
    ...style
  };

  return (
    <div
      ref={menuRef}
      className={`mui-replacement-menu ${className}`}
      style={baseStyle}
      role="menu"
      tabIndex={-1}
      {...rest}
    >
      {children}
    </div>
  );
};

export default Menu; 