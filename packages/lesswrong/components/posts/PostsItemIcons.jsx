import React from 'react';
import { registerComponent, Components, getSetting } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles'
import classNames from 'classnames';
import Tooltip from '@material-ui/core/Tooltip';
import StarIcon from '@material-ui/icons/Star';
import PersonIcon from '@material-ui/icons/Person';

const styles = theme => ({
  postIcon: {
    marginLeft: theme.spacing.unit,
    marginRight: theme.spacing.unit,
  },
  icon: {
    fontSize: "1.2rem",
    color: theme.palette.grey[500],
    position: "relative",
    top: 3,
  },
  alignmentIcon: {
    fontSize: "1rem",
    color: theme.palette.grey[500],
    top: 0,
  },
});

const PostsItemIcons = ({post, classes}) => {
  const { OmegaIcon } = Components;
  
  return <React.Fragment>
    {post.curatedDate && <span className={classes.postIcon}>
      <Tooltip title="Curated Post">
        <StarIcon className={classes.icon}/>
      </Tooltip>
    </span>}
    
    {!post.frontpageDate && <span className={classes.postIcon}>
      <Tooltip title="Personal Blogpost">
        <PersonIcon className={classes.icon}/>
      </Tooltip>
    </span>}
    
    {getSetting('forumType') !== 'AlignmentForum' && post.af &&
      <span className={classes.postIcon}>
        <Tooltip title="Crossposted from AlignmentForum.org">
          <OmegaIcon className={classNames(classes.icon, classes.alignmentIcon)}/>
        </Tooltip>
      </span>
    }
  </React.Fragment>
}

registerComponent('PostsItemIcons', PostsItemIcons, withStyles(styles, { name: "PostsItemIcons" }));