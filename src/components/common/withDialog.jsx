import React, { PureComponent } from 'react';
import { Components } from 'meteor/vulcan:core';
import ClickAwayListener from '@material-ui/core/ClickAwayListener';

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
    const ModalComponent = Components[this.state.componentName];

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

// Higher-order component for managing dialogs.
export default function withDialog(Component) {
  return function WithDialogComponent(props) {
    return (
      <OpenDialogContext.Consumer>
        {dialogFns =>
          <Component {...props}
            openDialog={dialogFns.openDialog}
            closeDialog={dialogFns.closeDialog}
          />
        }
      </OpenDialogContext.Consumer>
    );
  }
}
