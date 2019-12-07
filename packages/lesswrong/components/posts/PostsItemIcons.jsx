import React from 'react';
import { registerComponent, Components, getSetting } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles'
import classNames from 'classnames';
import Tooltip from '@material-ui/core/Tooltip';
import StarIcon from '@material-ui/icons/Star';
import PersonIcon from '@material-ui/icons/Person';
import DetailsIcon from '@material-ui/icons/Details';
import GroupIcon from '@material-ui/icons/Group';

const MetaTitle = getSetting('forumType') === 'EAForum' ? 'Community Post' : 'Meta Post'
const MetaIcon = getSetting('forumType') === 'EAForum' ? GroupIcon : DetailsIcon

const styles = theme => ({
  iconSet: {
    marginLeft: theme.spacing.unit,
    marginRight: theme.spacing.unit,
    lineHeight: "1.0rem",
  },
  postIcon: {
    marginRight: 4,
  },
  icon: {
    // note: the specificity seems necessary to successfully override the OmegaIcon styling.
    // not sure if this is best way to do this
    '&&': {
      fontSize: "1.2rem",
      color: theme.palette.grey[500],
      position: "relative",
      top: 3,
    }
  },
  alignmentIcon: {
    '&&':{
      top: 0,
    }
  },
});

const PostsItemIcons = ({post, classes}) => {
  const { OmegaIcon } = Components;

  const isPersonalBlogpost = getSetting('forumType') === 'EAForum' ?
    !(post.frontpageDate || post.meta) :
    !post.frontpageDate

  return <span className={classes.iconSet}>
    {post.curatedDate && <span className={classes.postIcon}>
      <Tooltip title="Curated Post" placement="right">
        <StarIcon className={classes.icon}/>
      </Tooltip>
    </span>}

    {isPersonalBlogpost && <span className={classes.postIcon}>
      <Tooltip title="Personal Blogpost" placement="right">
        <PersonIcon className={classes.icon}/>
      </Tooltip>
    </span>}

    {post.meta && <span className={classes.postIcon}>
      <Tooltip title={MetaTitle} placement="right">
        <MetaIcon className={classes.icon}/>
      </Tooltip>
    </span>}

    {getSetting('forumType') !== 'AlignmentForum' && post.af &&
      <span className={classes.postIcon}>
        <Tooltip title="Crossposted from AlignmentForum.org" placement="right">
          <span><OmegaIcon className={classNames(classes.icon, classes.alignmentIcon)}/></span>
        </Tooltip>
      </span>
    }
  </span>
}

registerComponent('PostsItemIcons', PostsItemIcons, withStyles(styles, { name: "PostsItemIcons" }));
