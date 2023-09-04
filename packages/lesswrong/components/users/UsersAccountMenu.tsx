import { Components, registerComponent, RouterLocation } from '../../lib/vulcan-lib';
import React, { PureComponent } from 'react';

import Popover from '@material-ui/core/Popover';
import Button from '@material-ui/core/Button';
import { withTracking } from '../../lib/analyticsEvents';
import { isEAForum } from '../../lib/instanceSettings';
import { withLocation } from '../../lib/routeUtil';
import { isFriendlyUI } from '../../themes/forumTheme';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    marginTop: isFriendlyUI ? undefined : 5,
  },
  userButton: {
    fontSize: '14px',
    fontWeight: isFriendlyUI ? undefined : 400,
    opacity: .8,
    color: theme.palette.header.text,
  },
  login: {
    marginLeft: 12,
    marginRight: 8
  },
  signUp: {
    display: 'inline-block',
    marginRight: 8,
    '@media (max-width: 540px)': {
      display: 'none'
    }
  },
})

interface UsersAccountMenuProps extends WithStylesProps {
  captureEvent?: any,
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
    const { classes, location } = this.props
    const { EAButton, WrappedLoginForm } = Components
    
    // Location is always passed in by hoc. We can't make it a required prop due
    // to a limitation in our typings
    const { pathname } = location!

    return (
      <div className={classes.root}>
        {isEAForum ? <>
          <EAButton style="grey" href={`/auth/auth0?returnTo=${pathname}`} className={classes.login}>
            Login
          </EAButton>
          <EAButton href={`/auth/auth0?screen_hint=signup&returnTo=${pathname}`} className={classes.signUp}>
            Sign up
          </EAButton>
        </> : <>
          <Button onClick={this.handleClick}>
            <span className={classes.userButton}>
              Login
            </span>
          </Button>
          <Popover
            open={this.state.open}
            anchorEl={this.state.anchorEl}
            anchorOrigin={{horizontal: 'left', vertical: 'bottom'}}
            onClose={this.handleRequestClose}
          >
            {this.state.open && <WrappedLoginForm />}
          </Popover>
        </>}
      </div>
    )
  }
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
