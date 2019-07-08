import React from 'react';
import { registerComponent, Components, getSetting } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles'
import classNames from 'classnames';
import Tooltip from '@material-ui/core/Tooltip';
import StarIcon from '@material-ui/icons/Star';
import PersonIcon from '@material-ui/icons/Person';
import DetailsIcon from '@material-ui/icons/Details';

const styles = theme => ({
  iconSet: {
    marginLeft: theme.spacing.unit,
    marginRight: theme.spacing.unit,
  },
  postIcon: {
    marginRight: 4,
  },
  icon: {
    fontSize: "1.2rem",
    color: theme.palette.grey[500],
    position: "relative",
    top: 3,
  },
  alignmentIcon: {
    fontSize: "1rem",
    top: 0,
  },
});

const PostsItemIcons = ({post, classes}) => {
  const { OmegaIcon } = Components;
  
  return <span className={classes.iconSet}>
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
    
    {post.meta && <span className={classes.postIcon}>
      <Tooltip title="Meta Post">
        <DetailsIcon  className={classes.icon}/>
      </Tooltip>
    </span>}
    
    {getSetting('forumType') !== 'AlignmentForum' && post.af &&
      <span className={classes.postIcon}>
        <Tooltip title="Crossposted from AlignmentForum.org">
          <span><OmegaIcon className={classNames(classes.icon, classes.alignmentIcon)}/></span>
        </Tooltip>
      </span>
    }
  </span>
}

registerComponent('PostsItemIcons', PostsItemIcons, withStyles(styles, { name: "PostsItemIcons" }));