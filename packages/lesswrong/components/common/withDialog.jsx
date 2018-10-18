import React, { PureComponent } from 'react';
import ClickAwayListener from '@material-ui/core/ClickAwayListener';

export const OpenDialogContext = React.createContext('openDialog');

export class DialogManager extends PureComponent {
  constructor(props) {
    super(props);
    
    this.state = {
      currentDialog: null,
    };
  }
  
  closeDialog() {
    this.setState({
      currentDialog: null
    });
  }
  
  render() {
    const { children } = this.props;
    
    return (
      <OpenDialogContext.Provider value={{
        openDialog: (dialog) => this.setState({ currentDialog: dialog }),
        closeDialog: () => this.closeDialog()
      }}>
        {children}
        
        {this.state.currentDialog &&
          <ClickAwayListener onClickAway={() => this.closeDialog()}>
            {this.state.currentDialog}
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

