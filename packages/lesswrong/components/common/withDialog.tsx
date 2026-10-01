import React, { useMemo, useCallback, useState } from 'react';
import { SuspenseWrapper } from './SuspenseWrapper';
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
  isDialogOpen: boolean,
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
    closeDialog: closeDialog,
    isDialogOpen: dialogName !== null,
  }), [captureEvent, closeDialog, dialogName]);
  
  useOnNavigate(() => {
    if (closeOnNavigate) closeDialog()
  })

  return (
    <OpenDialogContext.Provider value={providedContext}>
      {children}
      {/* Dialogs often contain lazily-loaded components (eg editors). Without
          this boundary, those suspending would blank the whole page. */}
      {dialogContents && <span>
        <SuspenseWrapper name="DialogManager">
          {dialogContents({onClose: closeDialog})}
        </SuspenseWrapper>
      </span>}
    </OpenDialogContext.Provider>
  );
}

export const useDialog = (): OpenDialogContextType => {
  const result = React.useContext(OpenDialogContext);
  if (!result) throw new Error("useDialog called but not a descendent of DialogManagerComponent");
  return result;
}
