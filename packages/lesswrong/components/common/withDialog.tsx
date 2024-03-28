import React, { useMemo, useCallback, useState } from 'react';
import { Components } from '../../lib/vulcan-lib';
import { hookToHoc } from '../../lib/hocUtils';
import { useTracking } from '../../lib/analyticsEvents';
import { useOnNavigate } from '../hooks/useOnNavigate';

export type CloseableComponent = ComponentWithProps<{ onClose?: any }>

export interface OpenDialogContextType {
  openDialog: <T extends CloseableComponent>({componentName, componentProps, noClickawayCancel}: {
    componentName: T,
    componentProps?: Omit<React.ComponentProps<typeof Components[T]>,"onClose"|"classes">,
    noClickawayCancel?: boolean,
    closeOnNavigate?: boolean,
  }) => void,
  closeDialog: () => void,
}
export const OpenDialogContext = React.createContext<OpenDialogContextType|null>(null);


export const DialogManager = ({children}: {
  children: React.ReactNode,
}) => {
  const [componentNameWithProps, setComponentNameWithProps] = useState<{componentName: CloseableComponent, componentProps: any} | null>(null);
  const [noClickawayCancel, setNoClickawayCancel] = useState<any>(false);
  const [closeOnNavigate, setCloseOnNavigate] = useState<boolean>(false);
  const {captureEvent} = useTracking();
  const isOpen = !!componentNameWithProps?.componentName;
  
  const closeDialog = useCallback(() => {
    captureEvent("dialogBox", {open: false, dialogName: componentNameWithProps?.componentName})
    setComponentNameWithProps(null);
  }, [captureEvent, componentNameWithProps?.componentName]);

  const ModalComponent = isOpen ? (Components[componentNameWithProps?.componentName]) : null;
  
  const providedContext = useMemo((): OpenDialogContextType => ({
    openDialog: ({componentName, componentProps, noClickawayCancel, closeOnNavigate}) => {
      captureEvent("dialogBox", {open: true, dialogName: componentName})
      setComponentNameWithProps({componentName, componentProps});
      setNoClickawayCancel(noClickawayCancel || false)
      setCloseOnNavigate(closeOnNavigate || false)
    },
    closeDialog: closeDialog
  }), [captureEvent, closeDialog]);
  
  useOnNavigate(() => {
    if (closeOnNavigate) closeDialog()
  })

  const { LWClickAwayListener } = Components

  const modal = (ModalComponent && isOpen) && <ModalComponent {...componentNameWithProps?.componentProps} onClose={closeDialog} />
  const withClickaway = isOpen && (noClickawayCancel ? modal : <LWClickAwayListener onClickAway={closeDialog}>{modal}</LWClickAwayListener>);
  return (
    <OpenDialogContext.Provider value={providedContext}>
      {children}
      {isOpen && <span>{withClickaway}</span>}
    </OpenDialogContext.Provider>
  );
}

export const useDialog = (): OpenDialogContextType => {
  const result = React.useContext(OpenDialogContext);
  if (!result) throw new Error("useDialog called but not a descendent of DialogManagerComponent");
  return result;
}
export const withDialog = hookToHoc(useDialog);
export default withDialog;
