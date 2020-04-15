import React from 'react';
import { registerComponent, Components, getSetting } from '../../lib/vulcan-lib';
import classNames from 'classnames';
import StarIcon from '@material-ui/icons/Star';
import PersonIcon from '@material-ui/icons/Person';
import DetailsIcon from '@material-ui/icons/Details';
import GroupIcon from '@material-ui/icons/Group';
import LinkIcon from '@material-ui/icons/Link';

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
  question: {
    fontSize: "1.2rem",
    color: theme.palette.grey[500],
    fontWeight: '600'
  },
  alignmentIcon: {
    '&&':{
      top: 0,
    }
  },
  linkIcon: {
    fontSize: "1.2rem",
    color: theme.palette.grey[500],
    transform: 'rotate(-45deg)',
    position: "relative",
    top: 3
  }
});

const PostsItemIcons = ({post, classes}: {
  post: PostsBase,
  classes: ClassesType,
}) => {
  const { OmegaIcon, LWTooltip } = Components;

  const isPersonalBlogpost = getSetting('forumType') === 'EAForum' ?
    !(post.frontpageDate || post.meta) :
    !post.frontpageDate

  return <span className={classes.iconSet}>
    {post.curatedDate && <span className={classes.postIcon}>
      <LWTooltip title="Curated Post" placement="right">
        <StarIcon className={classes.icon}/>
      </LWTooltip>
    </span>}
    
    {post.question && <span className={classes.postIcon}>
      <LWTooltip title="Question Post" placement="right">
        <span className={classes.question}>Q</span>
      </LWTooltip>
    </span>}

    {post.url && <span className={classes.postIcon}>
      <LWTooltip title="Link Post" placement="right">
        <LinkIcon className={classes.linkIcon}/>
      </LWTooltip>
    </span>}

    {isPersonalBlogpost && <span className={classes.postIcon}>
      <LWTooltip title="Personal Blogpost" placement="right">
        <PersonIcon className={classes.icon}/>
      </LWTooltip>
    </span>}

    {post.meta && <span className={classes.postIcon}>
      <LWTooltip title={MetaTitle} placement="right">
        <MetaIcon className={classes.icon}/>
      </LWTooltip>
    </span>}

    {getSetting('forumType') !== 'AlignmentForum' && post.af &&
      <span className={classes.postIcon}>
        <LWTooltip title="Crossposted from AlignmentForum.org" placement="right">
          <span><OmegaIcon className={classNames(classes.icon, classes.alignmentIcon)}/></span>
        </LWTooltip>
      </span>
    }
  </span>
}

const PostsItemIconsComponent = registerComponent('PostsItemIcons', PostsItemIcons, {styles});

declare global {
  interface ComponentTypes {
    PostsItemIcons: typeof PostsItemIconsComponent
  }
}

