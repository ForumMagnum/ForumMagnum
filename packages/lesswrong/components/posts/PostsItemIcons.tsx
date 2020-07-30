import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import classNames from 'classnames';
import Posts from '../../lib/collections/posts/collection';
import StarIcon from '@material-ui/icons/Star';
import PersonIcon from '@material-ui/icons/Person';
import DetailsIcon from '@material-ui/icons/Details';
import GroupIcon from '@material-ui/icons/Group';
import LinkIcon from '@material-ui/icons/Link';
import { curatedUrl } from '../recommendations/RecommendationsAndCurated';
import { Link } from '../../lib/reactRouterWrapper';
import { forumTypeSetting } from '../../lib/instanceSettings';
const MetaIcon = forumTypeSetting.get() === 'EAForum' ? GroupIcon : DetailsIcon

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

  const isPersonalBlogpost = forumTypeSetting.get() === 'EAForum' ?
    !(post.frontpageDate || post.meta) :
    !post.frontpageDate

  return <span className={classes.iconSet}>
    {post.curatedDate && <span className={classes.postIcon}>
      <LWTooltip title={<div>Curated <div><em>(click to view all curated posts)</em></div></div>} placement="right">
        <Link to={curatedUrl}><StarIcon className={classes.icon}/></Link>
      </LWTooltip>
    </span>}
    
    {post.question && <span className={classes.postIcon}>
      <LWTooltip title={<div>Question <div><em>(click to view all questions)</em></div></div>} placement="right">
        <Link to={"/questions"}><span className={classes.question}>Q</span></Link>
      </LWTooltip>
    </span>}

    {post.url && <span className={classes.postIcon}>
      <LWTooltip title={<div>Link Post <div><em>(Click to see linked content)</em></div></div>} placement="right">
        <a href={post.url}><LinkIcon className={classes.linkIcon}/></a>
      </LWTooltip>
    </span>}

    {isPersonalBlogpost && <span className={classes.postIcon}>
      <LWTooltip title="Personal Blogpost" placement="right">
        <PersonIcon className={classes.icon}/>
      </LWTooltip>
    </span>}

    {post.meta && <span className={classes.postIcon}>
      <LWTooltip title={<div>Community <div><em>(Click to view all Community posts)</em></div></div>} placement="right">
        <Link to={"/meta"}><MetaIcon className={classes.icon}/></Link>
      </LWTooltip>
    </span>}

    {forumTypeSetting.get() !== 'AlignmentForum' && post.af &&
      <span className={classes.postIcon}>
        <LWTooltip title={<div>Crossposted from AlignmentForum.org<div><em>(Click to visit AF version)</em></div></div>} placement="right">
            <a href={`https://alignmentforum.org${Posts.getPageUrl(post)}`}><OmegaIcon className={classNames(classes.icon, classes.alignmentIcon)}/></a>
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
