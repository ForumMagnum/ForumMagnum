import React, { Component, PropTypes } from 'react';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
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
    const actions = this.props.actions.map(action => <span onTouchTap={this.handleClose}>{action}</span>)

    return (
      <span className="dialog-trigger-group">
        <span className="dialog-trigger" onClick={this.handleOpen}>{ this.props.trigger }</span>
        <Dialog
          title={this.props.title}
          actions={actions}
          modal={false}
          open={this.state.open}
          onRequestClose={this.handleClose}
        >
          {this.props.children}
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
  actions: [ <FlatButton label="Okay" primary={true}/> ],
  open: false,
}

registerComponent('DialogGroup', DialogGroup);
