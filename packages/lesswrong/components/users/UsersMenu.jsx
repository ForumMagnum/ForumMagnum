import { Components, registerComponent, getSetting } from 'meteor/vulcan:core';
import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import { Meteor } from 'meteor/meteor';
import { Link } from 'react-router-dom';
import Users from 'meteor/vulcan:users';
import { withApollo } from 'react-apollo';

import Paper from '@material-ui/core/Paper';
import Divider from '@material-ui/core/Divider';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import SettingsIcon from '@material-ui/icons/Settings';
import EmailIcon from '@material-ui/icons/Email';
import NotesIcon from '@material-ui/icons/Notes';
import PersonIcon from '@material-ui/icons/Person';

import Button from '@material-ui/core/Button';
import MenuItem from '@material-ui/core/MenuItem';
import { withStyles } from '@material-ui/core/styles';

import { Posts } from '../../lib/collections/posts';
import withUser from '../common/withUser';
import withDialog from '../common/withDialog'
import withHover from '../common/withHover'

const styles = theme => ({
  root: {
    marginTop: 5,
    wordBreak: 'break-all',
    position: "relative"
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
  icon: {

  },
  notAMember: {
    marginLeft: 5,
    opacity: 0.9
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
    let { currentUser, client, classes, color, openDialog, hover, anchorEl } = this.props;

    const { LWPopper } = Components

    if (!currentUser) return null;

    const showNewButtons = getSetting('forumType') !== 'AlignmentForum' || Users.canDo(currentUser, 'posts.alignment.new')
    const isAfMember = currentUser.groups && currentUser.groups.includes('alignmentForum')

    return (
      <div className={classes.root}>
        <Link to={`/users/${currentUser.slug}`}>
          <Button classes={{root: classes.userButtonRoot}}>
            <span className={classes.userButtonContents} style={{ color: color }}>
              {Users.getDisplayName(currentUser)}
              {getSetting('forumType') === 'AlignmentForum' && !isAfMember && <span className={classes.notAMember}> (Not a Member) </span>}
            </span>
          </Button>
        </Link>
        <LWPopper
          open={hover}
          anchorEl={anchorEl}
          placement="bottom"
        >
          <Paper>
            {showNewButtons &&
              <MenuItem onClick={()=>openDialog({componentName:"NewQuestionDialog"})}>
                New Question
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
            {showNewButtons && <Divider/>}
            { getSetting('forumType') === 'AlignmentForum' && !isAfMember && <MenuItem onClick={() => openDialog({componentName: "AFApplicationForm"})}>
              Apply for Membership
            </MenuItem> }
            <Link to={`/users/${currentUser.slug}`}>
              <MenuItem>
                <ListItemIcon>
                  <PersonIcon/>
                </ListItemIcon>
                User Profile
              </MenuItem>
            </Link>
            <Link to={`/account`}>
              <MenuItem>
                <ListItemIcon>
                  <SettingsIcon/>
                </ListItemIcon>
                Edit Settings
              </MenuItem>
            </Link>
            <Link to={`/inbox`}>
              <MenuItem>
                <ListItemIcon>
                  <EmailIcon/>
                </ListItemIcon>
                Private Messages
              </MenuItem>
            </Link>
            {currentUser?.shortformFeedId &&
              <Link to={Posts.getPageUrl({_id:currentUser.shortformFeedId, slug: "shortform"})}>
                <MenuItem>
                  <ListItemIcon>
                    <NotesIcon />
                  </ListItemIcon>
                  Shortform Page
                </MenuItem>
              </Link>
            }
            <Divider/>
            <MenuItem onClick={() => Meteor.logout(() => client.resetStore())}>
              Log Out
            </MenuItem>
          </Paper>
        </LWPopper>
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
  withUser, withApollo, withHover, withDialog, withStyles(styles, { name: "UsersMenu" })
);
