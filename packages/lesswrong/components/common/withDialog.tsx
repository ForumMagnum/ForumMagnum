import React, { useMemo, useCallback, useState } from 'react';
import { hookToHoc } from '../../lib/hocUtils';
import { useTracking } from '../../lib/analyticsEvents';
import { useOnNavigate } from '../hooks/useOnNavigate';

export type DialogContentsFn = (args: {onClose: () => void}) => React.ReactNode

export interface OpenDialogContextType {
  openDialog: ({name, contents, closeOnNavigate}: {
    name: string
    contents: DialogContentsFn
    closeOnNavigate?: boolean,
  }) => void,
  closeDialog: () => void,
}
export const OpenDialogContext = React.createContext<OpenDialogContextType|null>(null);


export const DialogManager = ({children}: {
  children: React.ReactNode,
}) => {
  const [dialogName, setDialogName] = useState<string|null>(null);
  const [dialogContents, setDialogContents] = useState<DialogContentsFn|null>(null);
  const [closeOnNavigate, setCloseOnNavigate] = useState<boolean>(false);
  const {captureEvent} = useTracking();
  
  const closeDialog = useCallback(() => {
    captureEvent("dialogBox", {open: false, dialogName})
    setDialogName(null);
    setDialogContents(null);
  }, [captureEvent, dialogName]);
  
  const providedContext = useMemo((): OpenDialogContextType => ({
    openDialog: ({name, contents, closeOnNavigate}) => {
      captureEvent("dialogBox", {open: true, dialogName: name})
      setDialogName(name);
      setDialogContents(() => contents);
      setCloseOnNavigate(closeOnNavigate || false)
    },
    closeDialog: closeDialog
  }), [captureEvent, closeDialog]);
  
  useOnNavigate(() => {
    if (closeOnNavigate) closeDialog()
  })

  return (
    <OpenDialogContext.Provider value={providedContext}>
      {children}
      {dialogContents && <span>
        {dialogContents({onClose: closeDialog})}
      </span>}
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
