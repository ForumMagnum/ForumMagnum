import { Components, registerComponent } from 'meteor/vulcan:core';
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

import Popover from 'material-ui/Popover';
import FlatButton from 'material-ui/FlatButton';

class UsersAccountMenu extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      open: false,
    }
  }

  handleTouchTap = (event) => {
    event.preventDefault();
    this.setState({
      open:true,
      anchorEl: event.currentTarget,
    });
  };

  handleRequestClose = () => {
    this.setState({
      open: false,
    });
  }

  render() {
    const labelStyle = {
      color: this.props.color
    }

    return (
      <div className="users-menu">
        <FlatButton labelStyle={ labelStyle } label="Login" onTouchTap={this.handleTouchTap} />
        <Popover
          open={this.state.open}
          anchorEl={this.state.anchorEl}
          anchorOrigin={{horizontal: 'left', vertical: 'bottom'}}
          targetOrigin={{horizontal: 'left', vertical: 'top'}}
          onRequestClose={this.handleRequestClose}
        >
          <Components.AccountsLoginForm />
        </Popover>
      </div>
    )
  }
}

UsersAccountMenu.propTypes = {
  color: PropTypes.string,
};

UsersAccountMenu.defaultProps = {
  color: "rgba(0, 0, 0, 0.6)"
}

registerComponent('UsersAccountMenu', UsersAccountMenu);
