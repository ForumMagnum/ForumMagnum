import React, { useMemo, useCallback, useState } from 'react';
import { Components } from '../../lib/vulcan-lib';
import ClickAwayListener from '@material-ui/core/ClickAwayListener';
import { hookToHoc } from '../../lib/hocUtils';
import { useTracking } from '../../lib/analyticsEvents';

interface OpenDialogContextType {
  openDialog: ({componentName,componentProps}: {componentName: string, componentProps?: Record<string,any>}) => void,
  closeDialog: ()=>void,
}
export const OpenDialogContext = React.createContext<OpenDialogContextType|null>(null);


export const DialogManager = ({children}: {
  children: React.ReactNode,
}) => {
  const [componentName,setComponentName] = useState<string|null>(null);
  const [componentProps,setComponentProps] = useState<any>(null);
  const {captureEvent} = useTracking();
  
  const closeDialog = useCallback(() => {
    captureEvent("dialogBox", {open: false, dialogName: componentName})
    setComponentName(null);
    setComponentProps(null);
  }, [captureEvent, componentName]);

  const ModalComponent = (componentName!==null) ? (Components[componentName as string]) : null;
  
  const providedContext = useMemo((): OpenDialogContextType => ({
    openDialog: ({componentName, componentProps}) => {
      captureEvent("dialogBox", {open: true, dialogName: componentName})
      setComponentName(componentName);
      setComponentProps(componentProps);
    },
    closeDialog: closeDialog
  }), [captureEvent, closeDialog]);

  return (
    <OpenDialogContext.Provider value={providedContext}>
      {children}

      {componentName &&
        <ClickAwayListener onClickAway={closeDialog}>
          <ModalComponent
            {...componentProps}
            onClose={closeDialog}
          />
        </ClickAwayListener>
      }
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
