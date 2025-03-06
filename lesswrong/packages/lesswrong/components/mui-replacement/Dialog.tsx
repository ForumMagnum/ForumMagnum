import React, { useEffect, useRef } from 'react';

export type DialogClassKey = 
  | 'root'
  | 'paper'
  | 'paperScrollPaper'
  | 'paperScrollBody'
  | 'container'
  | 'paperWidthXs'
  | 'paperWidthSm'
  | 'paperWidthMd'
  | 'paperWidthLg'
  | 'paperWidthXl'
  | 'paperFullWidth'
  | 'paperFullScreen';

export interface DialogProps {
  children: React.ReactNode;
  open: boolean;
  onClose?: (event: {}, reason: 'backdropClick' | 'escapeKeyDown') => void;
  className?: string;
  style?: React.CSSProperties;
  fullWidth?: boolean;
  fullScreen?: boolean;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
  scroll?: 'paper' | 'body';
  disableBackdropClick?: boolean;
  disableEscapeKeyDown?: boolean;
  disableEnforceFocus?: boolean;
  [key: string]: any; // For any other props
}

const Dialog = ({
  children,
  open,
  onClose,
  className = '',
  style = {},
  fullWidth = false,
  fullScreen = false,
  maxWidth = 'sm',
  scroll = 'paper',
  disableBackdropClick = false,
  disableEscapeKeyDown = false,
  disableEnforceFocus = false,
  ...rest
}: DialogProps) => {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (!disableEscapeKeyDown && open && event.key === 'Escape' && onClose) {
        onClose({}, 'escapeKeyDown');
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [disableEscapeKeyDown, open, onClose]);

  useEffect(() => {
    if (open && !disableEnforceFocus) {
      // Focus the dialog when it opens
      if (dialogRef.current) {
        dialogRef.current.focus();
      }
    }
  }, [open, disableEnforceFocus]);

  if (!open) return null;

  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget && !disableBackdropClick && onClose) {
      onClose({}, 'backdropClick');
    }
  };

  const getMaxWidthStyle = () => {
    if (!maxWidth) return {};
    
    const maxWidthMap = {
      xs: '444px',
      sm: '600px',
      md: '960px',
      lg: '1280px',
      xl: '1920px'
    };
    
    return { maxWidth: maxWidthMap[maxWidth] };
  };

  const backdropStyles: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1300,
  };

  const paperStyles: React.CSSProperties = {
    backgroundColor: 'white',
    borderRadius: '4px',
    boxShadow: '0px 11px 15px -7px rgba(0,0,0,0.2), 0px 24px 38px 3px rgba(0,0,0,0.14), 0px 9px 46px 8px rgba(0,0,0,0.12)',
    margin: '32px',
    position: 'relative',
    overflowY: scroll === 'paper' ? 'auto' : 'visible',
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '90vh',
    ...(fullWidth && { width: '100%' }),
    ...(fullScreen && { 
      width: '100vw', 
      height: '100vh', 
      margin: 0,
      maxHeight: '100vh',
      borderRadius: 0 
    }),
    ...getMaxWidthStyle(),
    ...style,
  };

  return (
    <div 
      className={`mui-dialog-backdrop ${className}`}
      style={backdropStyles}
      onClick={handleBackdropClick}
      {...rest}
    >
      <div 
        className="mui-dialog-paper"
        style={paperStyles}
        ref={dialogRef}
        tabIndex={-1}
      >
        {children}
      </div>
    </div>
  );
};

export default Dialog; 