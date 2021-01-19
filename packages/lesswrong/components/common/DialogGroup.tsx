import React, { Component } from 'react';
import PropTypes from 'prop-types';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogActions from '@material-ui/core/DialogActions';
import Button from '@material-ui/core/Button';
import { registerComponent, Components } from '../../lib/vulcan-lib';

interface DialogGroupProps {
  title?: string,
  trigger: any,
  actions: Array<any>,
  open?: boolean,
  children?: React.ReactNode,
}
interface DialogGroupState {
  open: boolean,
}

// Dialog group, with trigger-button and dialog-instance
class DialogGroup extends Component<DialogGroupProps,DialogGroupState> {

  constructor(props: DialogGroupProps) {
    super(props);
    this.state = {
      open: !!props.open,
    };
  }

  handleOpen = () => {
    this.setState({open: true});
  };

  handleClose = () => {
    this.setState({open: false});
  };

  render() {
    const { LWDialog } = Components;
    
    //eslint-disable-next-line react/jsx-key
    const actions = this.props.actions.map(action =>
      <span key={action} onClick={this.handleClose}>{action}</span>
    )

    return (
      <span className="dialog-trigger-group">
        <span className="dialog-trigger" onClick={this.handleOpen}>{ this.props.trigger }</span>
        <LWDialog
          open={this.state.open}
          onClose={this.handleClose}
        >
          {this.props.title && <DialogTitle>{this.props.title}</DialogTitle>}
          {this.props.children}
          <DialogActions>{actions}</DialogActions>
        </LWDialog>
      </span>
    );
  }
}

(DialogGroup as any).propTypes = {
  title: PropTypes.string,
  trigger: PropTypes.node,
  children: PropTypes.node,
  actions: PropTypes.array,
  open: PropTypes.bool
};
(DialogGroup as any).defaultProps = {
  children: undefined,
  actions: [ <Button key='Okay' color="primary">Okay</Button> ],
  open: false,
};

const DialogGroupComponent = registerComponent('DialogGroup', DialogGroup);

declare global {
  interface ComponentTypes {
    DialogGroup: typeof DialogGroupComponent
  }
}
