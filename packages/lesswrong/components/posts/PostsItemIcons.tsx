import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import classNames from 'classnames';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import { curatedUrl } from '../recommendations/RecommendationsAndCurated';
import { Link } from '../../lib/reactRouterWrapper';
import { isFriendlyUI } from '../../themes/forumTheme';
import { isAF } from '../../lib/instanceSettings';

const styles = (theme: ThemeType) => ({
  iconSet: {
    marginLeft: isFriendlyUI ? 6 : theme.spacing.unit,
    marginRight: isFriendlyUI ? 2 : theme.spacing.unit,
    lineHeight: "1.0rem",
    '&:empty': {
      display: 'none',
    },
  },
  postIcon: {
    marginRight: 4,
  },
  icon: {
    // note: the specificity seems necessary to successfully override the OmegaIcon styling.
    // not sure if this is best way to do this
    '&&': {
      fontSize: "1.2rem",
      color: isFriendlyUI ? theme.palette.grey[600] : theme.palette.icon.dim4,
      position: "relative",
      top: 3,
    },
  },
  curatedIcon: {
    fontSize: "1.2rem",
    color: isFriendlyUI ? theme.palette.grey[600] : theme.palette.icon.dim4,
    position: "relative",
    top: isFriendlyUI ? 2 : 3,
  },
  curatedIconColor: {
    color: isFriendlyUI ? theme.palette.icon.yellow : theme.palette.primary.main,
  },
  question: {
    fontSize: "1.2rem",
    color: isFriendlyUI ? theme.palette.grey[600] : theme.palette.icon.dim4,
    fontWeight: '600'
  },
  alignmentIcon: {
    '&&':{
      top: 0,
    }
  },
  linkIcon: {
    position: "relative",
    ...(isFriendlyUI
      ? {
        fontSize: "1.2rem",
        top: 1,
        color: theme.palette.grey[600],
      }
      : {
        fontSize: "1.2rem",
        top: 3,
        color: theme.palette.icon.dim4,
      }),
  },
  dialogueIcon: {
    strokeWidth: isFriendlyUI ? "2px" : undefined,
  },
  sparkleIcon: {
    color: isFriendlyUI ? theme.palette.grey[600] : theme.palette.icon.dim4,
  },
});

export const CuratedIcon = ({hasColor, classes}: {
  hasColor?: boolean,
  classes: ClassesType<typeof styles>,
}) => {
  const { LWTooltip, ForumIcon } = Components;

  return <span className={classes.postIcon}>
      <LWTooltip title={<div>Curated <div><em>(click to view all curated posts)</em></div></div>} placement="bottom-start">
        <Link to={curatedUrl}>
          <ForumIcon icon="Star" className={classNames(
            classes.curatedIcon,
            {[classes.curatedIconColor]: hasColor && isFriendlyUI},
          )}/>
        </Link>
      </LWTooltip>
    </span>
}

const CuratedIconComponent = registerComponent('CuratedIcon', CuratedIcon, {styles});


const PostsItemIcons = ({post, classes, hideCuratedIcon, hidePersonalIcon, showRecommendationIcon}: {
  post: PostsBase,
  hideCuratedIcon?: boolean,
  hidePersonalIcon?: boolean
  showRecommendationIcon?: boolean,
  classes: ClassesType<typeof styles>,
}) => {
  const { OmegaIcon, LWTooltip, CuratedIcon, ForumIcon } = Components;

  return <span className={classes.iconSet}>
    {post.curatedDate && !hideCuratedIcon && <CuratedIcon/>}
    
    {post.question && <span className={classes.postIcon}>
      <LWTooltip title={<div>Question <div><em>(click to view all questions)</em></div></div>} placement="right">
        <Link to={"/questions"}><span className={classes.question}>Q</span></Link>
      </LWTooltip>
    </span>}

    {post.url && <span className={classes.postIcon}>
      <LWTooltip title={<div>Link Post <div><em>(Click to see linked content)</em></div></div>} placement="right">
        <a href={post.url}><ForumIcon icon="Link" className={classes.linkIcon}/></a>
      </LWTooltip>
    </span>}

    {(post.debate || post.collabEditorDialogue) && <span className={classes.postIcon}>
      <LWTooltip title="Dialogue" placement="right">
        <ForumIcon
          icon={
            isFriendlyUI
              ? "ChatBubbleLeftRight"
              : "ChatBubbleLeftRightFilled"
          }
          className={classNames(classes.icon, classes.dialogueIcon)}
        />
      </LWTooltip>
    </span>}

    {!hidePersonalIcon && !post.frontpageDate && !post.isEvent && <span className={classes.postIcon}>
      <LWTooltip title="Personal Blogpost" placement="right">
        <ForumIcon icon="User" className={classes.icon} />
      </LWTooltip>
    </span>}

    {!isAF && post.af && <span className={classes.postIcon}>
      <LWTooltip title={<div>Crossposted from AlignmentForum.org<div><em>(Click to visit AF version)</em></div></div>} placement="right">
          <a href={`https://alignmentforum.org${postGetPageUrl(post)}`}><OmegaIcon className={classNames(classes.icon, classes.alignmentIcon)}/></a>
      </LWTooltip>
    </span>}
  
    {showRecommendationIcon && <span className={classes.postIcon}>
      <LWTooltip title="Recommended algorithmically for you" placement="right">
        <ForumIcon icon="Sparkle" className={classNames(classes.icon, classes.sparkleIcon)} />
      </LWTooltip>
    </span>}

  </span>
}

const PostsItemIconsComponent = registerComponent('PostsItemIcons', PostsItemIcons, {styles});

declare global {
  interface ComponentTypes {
    PostsItemIcons: typeof PostsItemIconsComponent
    CuratedIcon: typeof CuratedIconComponent
  }
}
