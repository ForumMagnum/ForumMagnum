import React, { useMemo, useCallback, useState } from 'react';
import { Components } from '../../lib/vulcan-lib/components';
import { hookToHoc } from '../../lib/hocUtils';
import { useTracking } from '../../lib/analyticsEvents';
import { useOnNavigate } from '../hooks/useOnNavigate';

export type CloseableComponent = ComponentWithProps<{ onClose?: any }>

export interface OpenDialogContextType {
  openDialog: <T extends CloseableComponent>({componentName, componentProps}: {
    componentName: T,
    componentProps?: Omit<React.ComponentProps<typeof Components[T]>,"onClose"|"classes">,
    closeOnNavigate?: boolean,
  }) => void,
  closeDialog: () => void,
}
export const OpenDialogContext = React.createContext<OpenDialogContextType|null>(null);


export const DialogManager = ({children}: {
  children: React.ReactNode,
}) => {
  const [componentNameWithProps, setComponentNameWithProps] = useState<{componentName: CloseableComponent, componentProps: any} | null>(null);
  const [closeOnNavigate, setCloseOnNavigate] = useState<boolean>(false);
  const {captureEvent} = useTracking();
  const isOpen = !!componentNameWithProps?.componentName;
  
  const closeDialog = useCallback(() => {
    captureEvent("dialogBox", {open: false, dialogName: componentNameWithProps?.componentName})
    setComponentNameWithProps(null);
  }, [captureEvent, componentNameWithProps?.componentName]);

  const ModalComponent = isOpen ? (Components[componentNameWithProps?.componentName]) : null;
  
  const providedContext = useMemo((): OpenDialogContextType => ({
    openDialog: ({componentName, componentProps, closeOnNavigate}) => {
      captureEvent("dialogBox", {open: true, dialogName: componentName})
      setComponentNameWithProps({componentName, componentProps});
      setCloseOnNavigate(closeOnNavigate || false)
    },
    closeDialog: closeDialog
  }), [captureEvent, closeDialog]);
  
  useOnNavigate(() => {
    if (closeOnNavigate) closeDialog()
  })

  const modal = (ModalComponent && isOpen) && <ModalComponent {...componentNameWithProps?.componentProps} onClose={closeDialog} />
  return (
    <OpenDialogContext.Provider value={providedContext}>
      {children}
      {isOpen && <span>{modal}</span>}
    </OpenDialogContext.Provider>
  );
}

export const useDialog = (): OpenDialogContextType => {
  return {
    openDialog: () => {},
    closeDialog: () => {},
  }
}
export const withDialog = hookToHoc(useDialog);
export default withDialog;
