import { Components, registerComponent, RouterLocation } from '../../lib/vulcan-lib';
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

import Popover from '@material-ui/core/Popover';
import Button from '@material-ui/core/Button';
import { withTracking } from '../../lib/analyticsEvents';
import { forumTypeSetting } from '../../lib/instanceSettings';
import { withLocation } from '../../lib/routeUtil';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    marginTop: 5,
  },
  userButton: {
    fontSize: '14px',
    fontWeight: 400,
    opacity: .8
  },
  signUpButton: {
    display: 'inline-block',
    [theme.breakpoints.down('xs')]: {
      display: 'none'
    }
  }
})

interface UsersAccountMenuProps extends WithStylesProps {
  captureEvent?: any,
  color?: string,
  location?: RouterLocation
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

  handleClick = (event: React.MouseEvent) => {
    event.preventDefault();
    this.props.captureEvent("loginButtonClicked", {open: true})
    this.setState({
      open:true,
      anchorEl: event.currentTarget as HTMLElement,
    });
  };

  handleRequestClose = () => {
    this.props.captureEvent("loginButtonClicked", {open: false})
    this.setState({
      open: false,
    });
  }

  render() {
    const { color, classes, location } = this.props
    // Location is always passed in by hoc. We can't make it a required prop due
    // to a limitation in our typings
    const { pathname } = location!

    return (
      <div className={classes.root}>
        {forumTypeSetting.get() === 'EAForum' ? <>
          <Button href={`/auth/auth0?returnTo=${pathname}`}>
            <span className={classes.userButton} style={{ color: color }}>
              Login
            </span>
          </Button>
          <div className={classes.signUpButton}>
            <Button href={`/auth/auth0?screen_hint=signup&returnTo=${pathname}`}>
              <span className={classes.userButton} style={{ color: color }}>
                Sign Up
              </span>
            </Button>
          </div>
        </> : <>
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
        </>}
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
  hocs: [withTracking, withLocation]
});

declare global {
  interface ComponentTypes {
    UsersAccountMenu: typeof UsersAccountMenuComponent
  }
}
