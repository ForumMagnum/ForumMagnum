import { registerComponent, Components } from 'meteor/vulcan:core';
import React from 'react';
import PropTypes from 'prop-types';
import Users from 'meteor/vulcan:users';
import { Link } from 'react-router-dom';
import Tooltip from '@material-ui/core/Tooltip';
import { truncate } from '../../lib/editor/ellipsize';
import DescriptionIcon from '@material-ui/icons/Description';
import MessageIcon from '@material-ui/icons/Message';
import { withStyles } from '@material-ui/core/styles';
import { BookIcon } from '../icons/bookIcon'
import classNames from 'classnames';

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
  bookIcon: {
    filter: "invert(100%)",
  },
  bio: {
    marginTop: theme.spacing.unit
  }
})

// Given a user (which may not be null), render the user name as a link with a
// tooltip. This should not be used directly; use UsersName instead.
const UsersNameDisplay = ({user, classes, nofollow=false, simple=false}) => {
  if (!user) return <Components.UserDeleted/>
  const { FormatDate } = Components
  const { htmlBio } = user

  const truncatedBio = truncate(htmlBio, 500)
  const postCount = Users.getPostCount(user)
  const commentCount = Users.getCommentCount(user)
  const sequenceCount = user.sequenceCount; // TODO: Counts LW sequences on Alignment Forum

  const tooltip = <div>
    <div className={classes.joined}>Joined on <FormatDate date={user.createdAt} format="MMM Do YYYY" /></div>
    { !!sequenceCount && <div>
        <BookIcon className={classNames(classes.icon, classes.bookIcon)}/> { sequenceCount } sequences
      </div>}
    { !!postCount && <div><DescriptionIcon className={classes.icon} /> { postCount } posts</div>}
    { !!commentCount && <div><MessageIcon className={classes.icon}  /> { commentCount } comments</div>}
    { truncatedBio && <div className={classes.bio } dangerouslySetInnerHTML={{__html: truncatedBio}}/>}
  </div>

  if (simple) {
    return <span className={classes.userName}>{Users.getDisplayName(user)}</span>
  }

  return <Tooltip title={tooltip}>
    <Link to={Users.getProfileUrl(user)} className={classes.userName}
      {...(nofollow ? {rel:"nofollow"} : {})}
    >
      {Users.getDisplayName(user)}
    </Link>
  </Tooltip>
}

UsersNameDisplay.propTypes = {
  user: PropTypes.object.isRequired,
}

registerComponent('UsersNameDisplay', UsersNameDisplay, withStyles(styles, {name: "UsersNameDisplay"}));
