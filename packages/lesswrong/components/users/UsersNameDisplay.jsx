import { registerComponent, getSetting, Components } from 'meteor/vulcan:core';
import React from 'react';
import PropTypes from 'prop-types';
import Users from 'meteor/vulcan:users';
import { Link } from '../../lib/reactRouterWrapper.js';
import Tooltip from '@material-ui/core/Tooltip';
import { truncate } from '../../lib/editor/ellipsize';
import DescriptionIcon from '@material-ui/icons/Description';
import MessageIcon from '@material-ui/icons/Message';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  userName: {
    whiteSpace: "nowrap"
  },
  joined: {
    fontStyle: "italic", 
    marginBottom: theme.spacing.unit
  },
  icon: {
    height: "1rem",
    width: "1rem",
    position: "relative",
    top: 2,
    color: "rgba(255,255,255,.8)"
  },
  bio: {
    marginTop: theme.spacing.unit
  }
})

const UsersNameDisplay = ({user, classes, nofollow=false}) => {
  if (!user) return <Components.UserDeleted/>
  const { FormatDate } = Components
  const { htmlBio } = user

  const truncatedBio = truncate(htmlBio, 500)
  const postCount = Users.getPostCount(user)
  const commentCount = Users.getCommentCount(user)

  const tooltip = <div>
    <div className={classes.joined}>Joined on <FormatDate date={user.createdAt} format="MMM Do YYYY" /></div>
    { !!postCount && <div><DescriptionIcon className={classes.icon} /> { postCount } posts</div>}
    { !!commentCount && <div><MessageIcon className={classes.icon}  /> { commentCount } comments</div>}
    { truncatedBio && <div className={classes.bio } dangerouslySetInnerHTML={{__html: truncatedBio}}/>}
  </div>

  return <Tooltip title={tooltip}>
    <Link to={Users.getProfileUrl(user)} className={classes.userName}
      {...(nofollow ? {rel:"nofollow"} : {})}
    >
      {getSetting('forumType') === 'AlignmentForum' ? (user.fullName || Users.getDisplayName(user)) : Users.getDisplayName(user)}
    </Link>
  </Tooltip>
}

UsersNameDisplay.propTypes = {
  user: PropTypes.object.isRequired,
}

UsersNameDisplay.displayName = 'UsersNameDisplay';

registerComponent('UsersNameDisplay', UsersNameDisplay, withStyles(styles, {name: "UsersNameDisplay"}));
