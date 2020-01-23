import React, { PureComponent } from 'react';
import { Components } from 'meteor/vulcan:core';
import ClickAwayListener from '@material-ui/core/ClickAwayListener';
import { hookToHoc } from '../../lib/hocUtils';
import { withTracking } from '../../lib/analyticsEvents';

export const OpenDialogContext = React.createContext('openDialog');

class DialogManagerComponent extends PureComponent {
  state = {
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
    const ModalComponent = componentName ? Components[componentName] : null;

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
export const useDialog = () => React.useContext(OpenDialogContext);
export const withDialog = hookToHoc(useDialog);
export default withDialog;
