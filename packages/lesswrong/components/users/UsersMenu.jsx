import { registerComponent, getSetting } from 'meteor/vulcan:core';
import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import { Meteor } from 'meteor/meteor';
import { Link } from 'react-router-dom';
import Users from 'meteor/vulcan:users';
import { withApollo } from 'react-apollo';

import Menu from '@material-ui/core/Menu';
import Button from '@material-ui/core/Button';
import MenuItem from '@material-ui/core/MenuItem';
import { withStyles } from '@material-ui/core/styles';

import withUser from '../common/withUser';
import withDialog from '../common/withDialog'

const styles = theme => ({
  root: {
    marginTop: 5,
    wordBreak: 'break-all'
  },
  userButtonRoot: {
    // Mui default is 16px, so we're halving it to bring it into line with the
    // rest of the header components
    paddingLeft: theme.spacing.unit,
    paddingRight: theme.spacing.unit
  },
  userButtonContents: {
    textTransform: 'none',
    fontSize: '16px',
    fontWeight: 400,
  },
  notAMember: {
    marginLeft: 5,
    opacity: 0.9
  },
  menu: {
    marginTop: theme.spacing.unit*5
  }
})

class UsersMenu extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      open: false,
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

  render() {
    let { currentUser, client, classes, color, openDialog } = this.props;

    if (!currentUser) return null;

    const showNewButtons = getSetting('forumType') !== 'AlignmentForum' || Users.canDo(currentUser, 'posts.alignment.new')
    const isAfMember = currentUser.groups && currentUser.groups.includes('alignmentForum')


    return (
      <div className={classes.root}>
        <Button onClick={this.handleClick} classes={{root: classes.userButtonRoot}}>
          <span className={classes.userButtonContents} style={{ color: color }}>
            {Users.getDisplayName(currentUser)}
            {getSetting('forumType') === 'AlignmentForum' && !isAfMember && <span className={classes.notAMember}> (Not a Member) </span>}
          </span>
        </Button>
        <Menu
          className={classes.menu}
          open={this.state.open}
          anchorEl={this.state.anchorEl}
          onClose={this.handleRequestClose}
        >
            {showNewButtons &&
              <MenuItem onClick={()=>openDialog({componentName:"NewQuestionDialog"})}>
                Ask Question [Beta]
              </MenuItem>
            }
            {showNewButtons && <Link to={`/newPost`}>
                <MenuItem>New Post</MenuItem>
              </Link>
            }
            {showNewButtons &&
              <MenuItem onClick={()=>openDialog({componentName:"NewShortformDialog"})}>
                New Shortform [Beta]
              </MenuItem>
            }
            { getSetting('forumType') === 'AlignmentForum' && !isAfMember && <MenuItem onClick={() => openDialog({componentName: "AFApplicationForm"})}>
              Apply for Membership
            </MenuItem> }
            <Link to={`/users/${currentUser.slug}`}>
              <MenuItem>Profile</MenuItem>
            </Link>
            <Link to={`/account`}>
              <MenuItem>
                Edit User Settings
              </MenuItem>
            </Link>
            <Link to={`/inbox`}>
              <MenuItem>Private Messages</MenuItem>
            </Link>
            <MenuItem onClick={() => Meteor.logout(() => client.resetStore())}>
              Log Out
            </MenuItem>
        </Menu>
      </div>
    )
  }
}

UsersMenu.propTypes = {
  color: PropTypes.string,
};

UsersMenu.defaultProps = {
  color: "rgba(0, 0, 0, 0.6)"
}

registerComponent('UsersMenu', UsersMenu,
  withUser, withApollo, withDialog, withStyles(styles, { name: "UsersMenu" })
);
