import { Components, registerComponent, getSetting } from 'meteor/vulcan:core';
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

import Popover from '@material-ui/core/Popover';
import Button from '@material-ui/core/Button';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  root: {
    marginTop: 5,
  },
  userButton: {
    fontSize: '14px',
    fontWeight: 400,
    opacity: .8
  }
})

class UsersAccountMenu extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      open: false,
      reCaptchaToken: null
    }
  }

  handleClick = (event) => {
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

  setReCaptchaToken = (token) => {
    this.setState({reCaptchaToken: token})
  }

  render() {
    const { color, classes } = this.props

    return (
      <div className={classes.root}>
        <Button onClick={this.handleClick}>
          <span className={classes.userButton} style={{ color: color }}>
            Login
          </span>
        </Button>
        <Popover
          open={this.state.open}
          anchorEl={this.state.anchorEl}
          anchorOrigin={{horizontal: 'left', vertical: 'bottom'}}
          onClose={this.handleRequestClose}
        >
          {this.state.open
            && getSetting('reCaptcha.apiKey')
            && <Components.ReCaptcha verifyCallback={this.setReCaptchaToken} action="login/signup"/>}
          <Components.AccountsLoginForm 
            onPreSignUpHook={(options) => {
              const reCaptchaToken = this.state.reCaptchaToken
              return {...options, profile: {...options.profile, reCaptchaToken}}
            }}
          />
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

registerComponent('UsersAccountMenu', UsersAccountMenu, withStyles(styles, { name: "UsersAccountMenu" }));
