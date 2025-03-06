import React, { useEffect, useState } from 'react';

interface SnackbarProps {
  children?: React.ReactNode;
  open: boolean;
  autoHideDuration?: number | null;
  message?: React.ReactNode;
  onClose?: (event: React.SyntheticEvent<any>, reason: string) => void;
  anchorOrigin?: {
    vertical: 'top' | 'bottom';
    horizontal: 'left' | 'center' | 'right';
  };
  className?: string;
  style?: React.CSSProperties;
  [key: string]: any; // For any other props
}

const Snackbar = ({
  children,
  open,
  autoHideDuration = 5000,
  message,
  onClose,
  anchorOrigin = { vertical: 'bottom', horizontal: 'left' },
  className = '',
  style = {},
  ...rest
}: SnackbarProps) => {
  const [exited, setExited] = useState(!open);

  useEffect(() => {
    if (open) {
      setExited(false);
    }
  }, [open]);

  useEffect(() => {
    if (open && autoHideDuration && onClose) {
      const autoHideTimer = setTimeout(() => {
        onClose({} as React.SyntheticEvent, 'timeout');
      }, autoHideDuration);

      return () => {
        clearTimeout(autoHideTimer);
      };
    }
  }, [open, autoHideDuration, onClose]);

  if (!open && exited) {
    return null;
  }

  const handleClose = (event: React.SyntheticEvent) => {
    if (onClose) {
      onClose(event, 'clickaway');
    }
  };

  const getPositionStyles = () => {
    const { vertical, horizontal } = anchorOrigin;
    
    return {
      ...(vertical === 'top' ? { top: 24 } : { bottom: 24 }),
      ...(horizontal === 'left' ? { left: 24 } : {}),
      ...(horizontal === 'center' ? { left: '50%', transform: 'translateX(-50%)' } : {}),
      ...(horizontal === 'right' ? { right: 24 } : {}),
    };
  };

  const snackbarStyles: React.CSSProperties = {
    position: 'fixed',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: '6px 16px',
    borderRadius: '4px',
    minWidth: '288px',
    maxWidth: '568px',
    backgroundColor: '#323232',
    color: '#fff',
    boxShadow: '0px 3px 5px -1px rgba(0,0,0,0.2), 0px 6px 10px 0px rgba(0,0,0,0.14), 0px 1px 18px 0px rgba(0,0,0,0.12)',
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: '0.875rem',
    fontWeight: 400,
    lineHeight: '1.43',
    letterSpacing: '0.01071em',
    zIndex: 1400,
    transition: 'transform 0.225s cubic-bezier(0.0, 0, 0.2, 1) 0ms, opacity 0.225s cubic-bezier(0.0, 0, 0.2, 1) 0ms',
    ...getPositionStyles(),
    ...style,
  };

  return (
    <div
      className={`mui-snackbar ${className}`}
      style={snackbarStyles}
      role="alert"
      {...rest}
    >
      {children || message}
    </div>
  );
};

export default Snackbar; 