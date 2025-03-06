import React, { useContext } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import classNames from 'classnames';
import { isRecombeeRecommendablePost, postGetPageUrl } from '../../lib/collections/posts/helpers';
import { curatedUrl } from '../recommendations/curatedUrl';
import { Link } from '../../lib/reactRouterWrapper';
import { isFriendlyUI } from '../../themes/forumTheme';
import { isAF } from '../../lib/instanceSettings';
import { useTracking } from '@/lib/analyticsEvents';
import { useSetIsHiddenMutation } from '../dropdowns/posts/useSetIsHidden';
import { recombeeEnabledSetting } from '@/lib/publicSettings';
import { recombeeApi } from '@/lib/recombee/client';
import { useCurrentUser } from '../common/withUser';
import { IsRecommendationContext } from '../dropdowns/posts/PostActions';
import LWTooltip from "@/components/common/LWTooltip";
import ForumIcon from "@/components/common/ForumIcon";
import OmegaIcon from "@/components/icons/OmegaIcon";

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
      "--icon-size": "15.6px",
      fontSize: "15.6px",
      color: isFriendlyUI ? theme.palette.grey[600] : theme.palette.icon.dim4,
      position: "relative",
      top: 3,
    },
  },
  curatedIcon: {
    "--icon-size": "15.6px",
    color: isFriendlyUI ? theme.palette.grey[600] : theme.palette.icon.dim4,
    position: "relative",
    top: isFriendlyUI ? 2 : 3,
  },
  curatedIconColor: {
    color: isFriendlyUI ? theme.palette.icon.yellow : theme.palette.primary.main,
  },
  question: {
    "--icon-size": "15.6px",
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
    "--icon-size": "15.6px",
    ...(isFriendlyUI
      ? {
        top: 1,
        color: theme.palette.grey[600],
      }
      : {
        top: 3,
        color: theme.palette.icon.dim4,
      }),
  },
  dialogueIcon: {
    strokeWidth: isFriendlyUI ? "2px" : undefined,
  },
  recommendationIcon: {
    color: isFriendlyUI ? theme.palette.grey[600] : theme.palette.icon.dim4,
    '&:hover': {
      opacity: 0.5
    }
  }
});

const CuratedIcon = ({hasColor, classes}: {
  hasColor?: boolean,
  classes: ClassesType<typeof styles>,
}) => {
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

export const CuratedIconComponent = registerComponent('CuratedIcon', CuratedIcon, {styles});


const RecommendedPostIcon = ({post, hover, classes}: {
  post: PostsBase,
  hover?: boolean,
  classes: ClassesType<typeof styles>,
}) => {
  const { captureEvent } = useTracking() 
  const { setIsHiddenMutation } = useSetIsHiddenMutation();
  const currentUser = useCurrentUser();

  const notInterestedClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!!currentUser && recombeeEnabledSetting.get() && isRecombeeRecommendablePost(post)) {
      void recombeeApi.createRating(post._id, currentUser._id, "bigDownvote");
    }

    void setIsHiddenMutation({postId: post._id, isHidden: true})
    captureEvent("recommendationNotInterestedClicked", {postId: post._id})
  }

  return <span className={classes.postIcon}>
    <LWTooltip title="Hide this recommendation and show fewer like it" placement="right"> 
      {hover 
        ? <ForumIcon icon="NotInterested" onClick={notInterestedClick} className={classNames(classes.icon, classes.recommendationIcon)} />
        : <ForumIcon icon="Sparkle" className={classNames(classes.icon, classes.recommendationIcon)} />
      }
    </LWTooltip>
  </span>
}


const PostsItemIcons = ({post, hover, classes, hideCuratedIcon, hidePersonalIcon}: {
  post: PostsBase,
  hover?: boolean,
  hideCuratedIcon?: boolean,
  hidePersonalIcon?: boolean
  classes: ClassesType<typeof styles>,
}) => {
  const showRecommendationIcon = useContext(IsRecommendationContext)

  return <span className={classes.iconSet}>
    {post.curatedDate && !hideCuratedIcon && <CuratedIconComponent/>}
    
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

    {showRecommendationIcon && <RecommendedPostIcon post={post} hover={hover} classes={classes}/>}

  </span>
}

const PostsItemIconsComponent = registerComponent('PostsItemIcons', PostsItemIcons, {styles});

declare global {
  interface ComponentTypes {
    PostsItemIcons: typeof PostsItemIconsComponent
    CuratedIcon: typeof CuratedIconComponent
  }
}

export {
  CuratedIconComponent as CuratedIcon,
  PostsItemIconsComponent as PostsItemIcons
}
