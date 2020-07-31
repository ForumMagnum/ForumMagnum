import { Components, registerComponent } from '../../lib/vulcan-lib';
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

import Popover from '@material-ui/core/Popover';
import Button from '@material-ui/core/Button';
import { withTracking } from '../../lib/analyticsEvents';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    marginTop: 5,
  },
  userButton: {
    fontSize: '14px',
    fontWeight: 400,
    opacity: .8
  }
})

interface UsersAccountMenuProps extends WithStylesProps {
  captureEvent?: any,
  color?: string,
}
interface UsersAccountMenuState {
  open: boolean,
  anchorEl: HTMLElement|null,
}

class UsersAccountMenu extends PureComponent<UsersAccountMenuProps,UsersAccountMenuState> {
  constructor(props: UsersAccountMenuProps) {
    super(props);
    this.state = {
      open: false,
      anchorEl: null,
    }
  }

  handleClick = (event) => {
    event.preventDefault();
    this.props.captureEvent("loginButtonClicked", {open: true})
    this.setState({
      open:true,
      anchorEl: event.currentTarget,
    });
  };

  handleRequestClose = () => {
    this.props.captureEvent("loginButtonClicked", {open: false})
    this.setState({
      open: false,
    });
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
          {this.state.open && <Components.WrappedLoginForm />}
        </Popover>
      </div>
    )
  }
};

(UsersAccountMenu as any).propTypes = {
  color: PropTypes.string,
};

(UsersAccountMenu as any).defaultProps = {
  color: "rgba(0, 0, 0, 0.6)"
};

const UsersAccountMenuComponent = registerComponent('UsersAccountMenu', UsersAccountMenu, {
  styles,
  hocs: [withTracking]
});

declare global {
  interface ComponentTypes {
    UsersAccountMenu: typeof UsersAccountMenuComponent
  }
}
