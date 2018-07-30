import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Components, registerComponent, withEdit, withCurrentUser, getSetting } from 'meteor/vulcan:core';
import { withRouter } from 'react-router';
import { Link } from 'react-router';
import NoSSR from 'react-no-ssr';
import Headroom from 'react-headroom'
import muiThemeable from 'material-ui/styles/muiThemeable';
import { withStyles, withTheme } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';
import MenuIcon from '@material-ui/icons/Menu';
import Typography from '@material-ui/core/Typography';
import Hidden from '@material-ui/core/Hidden';
import { withApollo } from 'react-apollo';
import Users from 'meteor/vulcan:users';
import getHeaderSubtitleData from '../../lib/modules/utils/getHeaderSubtitleData';

const styles = theme => ({
  appBar: {
    boxShadow: "0 1px 1px rgba(0, 0, 0, 0.05), 0 1px 1px rgba(0, 0, 0, 0.05)",
  },
  root: {
    flexGrow: 1,
  },
  title: {
    flex: 1,
  },
  titleLink: {
    verticalAlign: 'text-bottom',
    fontSize: 19,
    marginTop: 1,
    color: theme.palette.primary.contrastText,
    '&:hover, &:focus, &:active': {
      textDecoration: 'none',
      opacity: 0.7,
    }
  },
  subtitle: {
    marginLeft: '1em',
    paddingLeft: '1em',
    textTransform: 'uppercase',
    borderLeft: `1px solid ${theme.palette.primary.contrastText}`,
  },
  menuButton: {
    marginLeft: -theme.spacing.unit,
    marginRight: theme.spacing.unit,
  },
  negativeRightMargin: {
    marginRight: -theme.spacing.unit,
  }
});

class Header extends Component {
  constructor(props) {
    super(props);
    this.state = {
      navigationOpen: false,
      notificationOpen: false,
    };
  }

  handleNavigationToggle = (muiState) => this.setState({navigationOpen: !this.state.navigationOpen})
  handleNavigationClose = () => this.setState({navigationOpen: false})

  handleNotificationToggle = (muiState) => {
    this.props.editMutation({
      documentId: this.props.currentUser._id,
      set: {lastNotificationsCheck: new Date()},
      unset: {}
    })
    this.setState({notificationOpen: !this.state.notificationOpen})
  }
  handleNotificationClose = () => this.setState({notificationOpen: false});

  render() {
    const { currentUser, classes, routes, location, params, client, theme } = this.props
    const { notificationOpen, navigationOpen } = this.state
    const routeName = routes[1].name
    const query = location && location.query
    const { subtitleLink = "", subtitleText = "" } = getHeaderSubtitleData(routeName, query, params, client) || {}
    const notificationTerms = {view: 'userNotifications', userId: currentUser ? currentUser._id : "", type: "newMessage"}

    return (
      <Components.ErrorBoundary>
        <div className={classes.root}>
          <Headroom disableInlineStyles downTolerance={10} upTolerance={10} >
            <AppBar className={classes.appBar} position="static">
              <Toolbar>
                <IconButton className={classes.menuButton} color="inherit" aria-label="Menu" onClick={this.handleNavigationToggle}>
                  <MenuIcon />
                </IconButton>
                <Typography className={classes.title} variant="title" color="textSecondary">
                  <Hidden smDown implementation="css">
                    <Link to="/" className={classes.titleLink}>
                      {getSetting('forumSettings.headerTitle', 'LESSWRONG')}
                    </Link>
                    {subtitleLink && <span className={classes.subtitle}>
                      <Link to={subtitleLink} className={classes.titleLink}>
                        {subtitleText}
                      </Link>
                    </span>}
                  </Hidden>
                  <Hidden mdUp implementation="css">
                    <Link to="/" className={classes.titleLink}>
                      {getSetting('forumSettings.shortForumTitle', 'LW')}
                    </Link>
                  </Hidden>
                </Typography>
                <div className={classes.negativeRightMargin}>
                  <NoSSR><Components.ErrorBoundary>
                    <Components.SearchBar color={theme.palette.primary.contrastText} />
                  </Components.ErrorBoundary></NoSSR>
                  {currentUser ? <Components.UsersMenu color={theme.palette.primary.contrastText} /> : <Components.UsersAccountMenu color={theme.palette.primary.contrastText} />}
                  {currentUser && <Components.NotificationsMenuButton color={theme.palette.primary.contrastText} toggle={this.handleNotificationToggle} terms={{view: 'userNotifications', userId: currentUser._id}} open={notificationOpen}/>}
                </div>
              </Toolbar>
            </AppBar>
            <Components.NavigationMenu open={navigationOpen} handleClose={this.handleNavigationClose} handleToggle={this.handleNavigationToggle}/>
          </Headroom>
          <Components.ErrorBoundary>
            <Components.NotificationsMenu open={notificationOpen} terms={notificationTerms} handleToggle={this.handleNotificationToggle} />
          </Components.ErrorBoundary>
        </div>
      </Components.ErrorBoundary>
    )
  }
}

Header.displayName = "Header";

Header.propTypes = {
  currentUser: PropTypes.object,
  classes: PropTypes.object.isRequired,
  routes: PropTypes.array.isRequired,
  location: PropTypes.object.isRequired,
  params: PropTypes.object,
  client: PropTypes.object.isRequired,
};

const withEditOptions = {
  collection: Users,
  fragmentName: 'UsersCurrent',
};

registerComponent('Header', Header, withRouter, withApollo, [withEdit, withEditOptions], withCurrentUser, muiThemeable(), withStyles(styles), withTheme());
