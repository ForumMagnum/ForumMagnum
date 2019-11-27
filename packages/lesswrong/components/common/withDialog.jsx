import React, { PureComponent } from 'react';
import { Components } from 'meteor/vulcan:core';
import ClickAwayListener from '@material-ui/core/ClickAwayListener';
import { hookToHoc } from '../../lib/hocUtils.js';

export const OpenDialogContext = React.createContext('openDialog');

export class DialogManager extends PureComponent {
  state = {
    currentDialog: null,
    componentProps: null
  };

  closeDialog = () => {
    this.setState({
      componentName: null,
      componentProps: null
    });
  }

  render() {
    const { children } = this.props;
    const { componentName } = this.state;
    const ModalComponent = componentName ? Components[componentName] : null;

    return (
      <OpenDialogContext.Provider value={{
        openDialog: ({componentName, componentProps}) => this.setState({
          componentName: componentName,
          componentProps: componentProps
        }),
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

export const useDialog = () => React.useContext(OpenDialogContext);
export const withDialog = hookToHoc(useDialog);
export default withDialog;
