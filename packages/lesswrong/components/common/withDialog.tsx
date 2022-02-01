import React, { useMemo, useCallback, useState } from 'react';
import { Components } from '../../lib/vulcan-lib';
import ClickAwayListener from '@material-ui/core/ClickAwayListener';
import { hookToHoc } from '../../lib/hocUtils';
import { useTracking } from '../../lib/analyticsEvents';

export interface OpenDialogContextType {
  openDialog: ({componentName, componentProps, noClickawayCancel}: {componentName: string, componentProps?: Record<string,any>, noClickawayCancel?: boolean}) => void,
  closeDialog: ()=>void,
}
export const OpenDialogContext = React.createContext<OpenDialogContextType|null>(null);


export const DialogManager = ({children}: {
  children: React.ReactNode,
}) => {
  const [componentName,setComponentName] = useState<string|null>(null);
  const [componentProps,setComponentProps] = useState<any>(null);
  const [noClickawayCancel,setNoClickawayCancel] = useState<any>(false);
  const {captureEvent} = useTracking();
  const isOpen = !!componentName;
  
  const closeDialog = useCallback(() => {
    captureEvent("dialogBox", {open: false, dialogName: componentName})
    setComponentName(null);
    setComponentProps(null);
  }, [captureEvent, componentName]);

  const ModalComponent = isOpen ? (Components[componentName as string]) : null;
  
  const providedContext = useMemo((): OpenDialogContextType => ({
    openDialog: ({componentName, componentProps, noClickawayCancel}) => {
      captureEvent("dialogBox", {open: true, dialogName: componentName})
      setComponentName(componentName);
      setComponentProps(componentProps);
      setNoClickawayCancel(noClickawayCancel||false);
    },
    closeDialog: closeDialog
  }), [captureEvent, closeDialog]);

  const modal = isOpen && <ModalComponent {...componentProps} onClose={closeDialog} />
  const withClickaway = isOpen && (noClickawayCancel ? modal : <ClickAwayListener onClickAway={closeDialog}>{modal}</ClickAwayListener>);
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
