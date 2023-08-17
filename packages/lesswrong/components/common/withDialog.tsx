import React, { useMemo, useCallback, useState } from 'react';
import { Components } from '../../lib/vulcan-lib';
import { hookToHoc } from '../../lib/hocUtils';
import { useTracking } from '../../lib/analyticsEvents';
import { useOnNavigate } from '../hooks/useOnNavigate';

export type CloseableComponents = {
  [T in keyof ComponentTypes]: FromPartial<ComponentTypes[T]['propTypes']> extends { onClose: any } | undefined ? T : never
}[keyof ComponentTypes];

// const foo: CloseableComponents = 'TagVersionHistory'

export interface OpenDialogContextType {
  openDialog: <T extends CloseableComponents>({componentName, componentProps, noClickawayCancel}: {
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
  const [componentName,setComponentName] = useState<CloseableComponents|null>(null);
  const [componentProps,setComponentProps] = useState<any>(null);
  const [noClickawayCancel, setNoClickawayCancel] = useState<any>(false);
  const [closeOnNavigate, setCloseOnNavigate] = useState<boolean>(false);
  const {captureEvent} = useTracking();
  const isOpen = !!componentName;
  
  const closeDialog = useCallback(() => {
    captureEvent("dialogBox", {open: false, dialogName: componentName})
    setComponentName(null);
    setComponentProps(null);
  }, [captureEvent, componentName]);

  const ModalComponent = isOpen ? (Components[componentName]) : null;
  
  const providedContext = useMemo((): OpenDialogContextType => ({
    openDialog: ({componentName, componentProps, noClickawayCancel, closeOnNavigate}) => {
      captureEvent("dialogBox", {open: true, dialogName: componentName})
      setComponentName(componentName);
      setComponentProps(componentProps);
      setNoClickawayCancel(noClickawayCancel || false)
      setCloseOnNavigate(closeOnNavigate || false)
    },
    closeDialog: closeDialog
  }), [captureEvent, closeDialog]);
  
  useOnNavigate(() => {
    if (closeOnNavigate) closeDialog()
  })

  const { LWClickAwayListener } = Components

  const modal = (ModalComponent && isOpen) && <ModalComponent {...componentProps} onClose={closeDialog} />
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
