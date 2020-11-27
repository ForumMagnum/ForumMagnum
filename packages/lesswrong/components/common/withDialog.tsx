import React, { PureComponent } from 'react';
import { Components } from '../../lib/vulcan-lib';
import ClickAwayListener from '@material-ui/core/ClickAwayListener';
import { hookToHoc } from '../../lib/hocUtils';
import { withTracking } from '../../lib/analyticsEvents';

interface OpenDialogContextType {
  openDialog: ({componentName,componentProps}: {componentName: string, componentProps?: Record<string,any>}) => void,
  closeDialog: ()=>void,
}
export const OpenDialogContext = React.createContext<OpenDialogContextType|null>(null);

interface DialogManagerComponentProps {
  captureEvent: any,
  children: React.ReactNode,
}
interface DialogManagerComponentState {
  componentName: string|null,
  componentProps: any,
}

class DialogManagerComponent extends PureComponent<DialogManagerComponentProps,DialogManagerComponentState> {
  state: DialogManagerComponentState = {
    componentName: null,
    componentProps: null
  };
  
  closeDialog = () => {
    this.props.captureEvent("dialogBox", {open: false, dialogName: this.state.componentName})
    this.setState({
      componentName: null,
      componentProps: null
    });
  }

  render() {
    const { children, captureEvent } = this.props;
    const { componentName } = this.state;
    const ModalComponent = (componentName!==null) ? (Components[componentName as string]) : null;

    return (
      <OpenDialogContext.Provider value={{
        openDialog: ({componentName, componentProps}) => {
          captureEvent("dialogBox", {open: true, dialogName: componentName})
          this.setState({
            componentName: componentName,
            componentProps: componentProps
          })
        },
        closeDialog: this.closeDialog
      }}>
        {children}

        {this.state.componentName &&
          <ClickAwayListener onClickAway={() => this.closeDialog()}>
            <ModalComponent
              {...this.state.componentProps}
              onClose={this.closeDialog}
            />
          </ClickAwayListener>
        }
      </OpenDialogContext.Provider>
    );
  }
}

export const DialogManager = withTracking(DialogManagerComponent)
export const useDialog = (): OpenDialogContextType => {
  const result = React.useContext(OpenDialogContext);
  if (!result) throw new Error("useDialog called but not a descendent of DialogManagerComponent");
  return result;
}
export const withDialog = hookToHoc(useDialog);
export default withDialog;
