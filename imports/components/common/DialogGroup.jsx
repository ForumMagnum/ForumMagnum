import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogActions from '@material-ui/core/DialogActions';
import Button from '@material-ui/core/Button';
import { registerComponent } from 'meteor/vulcan:core';

/**
 * Dialog group, with trigger-button and dialog-instance
 */

class DialogGroup extends Component {

  constructor(props) {
    super(props);
    this.state = {
      open: props.open,
    };
  }

  handleOpen = () => {
    this.setState({open: true});
  };

  handleClose = () => {
    this.setState({open: false});
  };

  render() {
    //eslint-disable-next-line react/jsx-key
    const actions = this.props.actions.map(action =>
      <span key={action} onClick={this.handleClose}>{action}</span>
    )

    return (
      <span className="dialog-trigger-group">
        <span className="dialog-trigger" onClick={this.handleOpen}>{ this.props.trigger }</span>
        <Dialog
          open={this.state.open}
          onClose={this.handleClose}
        >
          {this.props.title && <DialogTitle>{this.props.title}</DialogTitle>}
          {this.props.children}
          <DialogActions>{actions}</DialogActions>
        </Dialog>
      </span>
    );
  }
}

DialogGroup.propTypes = {
    title: PropTypes.string,
    trigger: PropTypes.node,
    children: PropTypes.node,
    actions: PropTypes.array,
    open: PropTypes.bool
}
DialogGroup.defaultProps = {
  children: undefined,
  actions: [ <Button key='Okay' color="primary">Okay</Button> ],
  open: false,
}

registerComponent('DialogGroup', DialogGroup);
