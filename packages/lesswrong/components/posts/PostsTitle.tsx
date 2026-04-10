import React, { CSSProperties, FC, PropsWithChildren } from 'react';
import classNames from 'classnames';
import { useCurrentUser, useCurrentUserId } from "../common/withUser";
import { useLocation } from '../../lib/routeUtil';
import { Link } from '../../lib/reactRouterWrapper';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import { getCommunityPath } from '@/lib/pathConstants';
import { InteractionWrapper } from '../common/useClickableCell';
import { smallTagTextStyle, tagStyle } from '../tagging/FooterTag';
import { PostsItemIcons, CuratedIcon } from "./PostsItemIcons";
import ForumIcon from "../common/ForumIcon";
import TagsTooltip from "../tagging/TagsTooltip";
import { amaTagIdSetting, annualReviewAnnouncementPostPathSetting, openThreadTagIdSetting, startHerePostIdSetting, isEAForum } from '@/lib/instanceSettings';
import QuestionAnswerIcon from '@/lib/vendor/@material-ui/icons/src/QuestionAnswer';
import ArrowForwardIcon from '@/lib/vendor/@material-ui/icons/src/ArrowForward';
import AllInclusiveIcon from '@/lib/vendor/@material-ui/icons/src/AllInclusive';
import StarIcon from '@/lib/vendor/@material-ui/icons/src/Star';
import { useIsOnGrayBackground } from '../hooks/useIsOnGrayBackground';
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles('PostsTitle', (theme: ThemeType) => ({
  root: {
    color: theme.palette.text.normal,
    position: "relative",
    lineHeight: "1.7rem",
    fontFamily: theme.typography.postStyle.fontFamily,
    zIndex: theme.zIndexes.postItemTitle,
    [theme.breakpoints.down('xs')]: {
      paddingLeft: 2,
    },
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    alignItems: "center",
    ...theme.typography.postsItemTitle,
    [theme.breakpoints.down('xs')]: {
      whiteSpace: "unset",
      lineHeight: "1.8rem",
    },
    marginRight: 8,
  },
  onGrayBackground: {
    ...(theme.dark && {
      color: theme.palette.greyAlpha(1),
    }),
  },
  wrap: {
    whiteSpace: "normal",
  },
  sticky: {
    paddingRight: 10,
    position: "relative",
    top: 2,
    color: theme.palette.icon["dim4"],
  },
  stickyIcon: {
    "--icon-size": "1.2rem",
  },
  primaryIcon: {
    color: theme.palette.icon.dim55,
    paddingRight: 8,
    top: -2,
    width: "auto",
    position: "relative",
    verticalAlign: "middle",
  },
  read: {
    color: theme.palette.text.dim55,
    '&:hover': {
      color: theme.palette.text.normal,
    }
  },
  eaTitleDesktopEllipsis: {},
  hideXsDown: {
    [theme.breakpoints.down('xs')]: {
      display: "none",
    }
  },
  tag: {
    marginRight: 8
  },
  popper: {
    opacity: 1, // this is because Tooltip has a default opacity less than 1
  },
  leftCurated: {
    position: "relative",
    top: -1,
    marginRight: 4,
  },
  interactionWrapper: {
    display: "inline-block",
  },
  strikethroughTitle: {
    textDecoration: "line-through"
  },
  eventTagLink: {
    '&:hover': {
      opacity: 0.8
    }
  },
  eventTag: {
    ...tagStyle(theme),
    ...smallTagTextStyle(theme),
    display: "flex",
    alignItems: "center",
    marginLeft: 10,
    padding: "0 6px",
    height: 20,
    border: "none",
    backgroundColor: theme.dark
      ? "var(--post-title-tag-foreground)"
      : "var(--post-title-tag-background)",
    color: theme.dark
      ? "var(--post-title-tag-background)"
      : "var(--post-title-tag-foreground)",
  },
  eventTagBordered: {
    border: theme.palette.border.normal,
    borderRadius: 2,
  },
  highlightedTagTooltip: {
    marginTop: -2,
  },
}));

const tagSettingIcons = new Map([
  [amaTagIdSetting, QuestionAnswerIcon], 
  [openThreadTagIdSetting, AllInclusiveIcon],
]);

// Cute hack
const reviewPostIdSetting = {
  get: () => isEAForum() ?
    annualReviewAnnouncementPostPathSetting.get()?.match(/^\/posts\/([a-zA-Z\d]+)/)?.[1] :
    null
}

const idSettingIcons = new Map([
  [startHerePostIdSetting, ArrowForwardIcon],
  // use an imposter to avoid duplicating annualReviewAnnouncementPostPathSetting, which is a path not a post id
  [reviewPostIdSetting, StarIcon]
]);

const postIcon = (post: PostsBase|PostsListBase) => {
  const matchingIdSetting = Array.from(idSettingIcons.keys()).find(idSetting => post._id === idSetting.get())
  if (matchingIdSetting) {
    return idSettingIcons.get(matchingIdSetting);
  }
  const tagSettingIconKeys = Array.from(tagSettingIcons.keys())
  //Sometimes this function will be called with fragments that don't have the tag array, in that case assume that the tag array is empty
  const postTags = ('tags' in post) ? (post as PostsListBase).tags : []
  if (!postTags) return null
  const matchingTagSetting = tagSettingIconKeys.find(tagSetting => (postTags).find(tag => tag._id === tagSetting.get()));
  if (matchingTagSetting) {
    return tagSettingIcons.get(matchingTagSetting);
  }
  return null;
}

const DefaultWrapper: FC<PropsWithChildren<{}>> = ({children}) => <>{children}</>;

const PostsTitle = ({post, postLink, sticky, read, showPersonalIcon=true, showDraftTag=true, wrap=false, showIcons=true, isLink=true, curatedIconLeft=true, strikethroughTitle=false, Wrapper=DefaultWrapper, showEventTag, linkEventProps, postItemHovered, className}: {
  post: PostsBase|PostsListBase,
  postLink?: string,
  sticky?: boolean,
  read?: boolean,
  showPersonalIcon?: boolean
  showDraftTag?: boolean,
  wrap?: boolean,
  showIcons?: boolean,
  isLink?: boolean,
  curatedIconLeft?: boolean
  strikethroughTitle?: boolean
  Wrapper?: FC<PropsWithChildren<{}>>,
  showEventTag?: boolean,
  linkEventProps?: Record<string, string>,
  postItemHovered?: boolean,
  className?: string,
}) => {
  const classes = useStyles(styles);
  const currentUserId = useCurrentUserId();
  const { pathname } = useLocation();
  const shared = post.draft && (post.userId !== currentUserId) && post.shareWithUsers
  const isOnGrayBackground = useIsOnGrayBackground();

  const shouldRenderEventsTag = (pathname !== getCommunityPath()) && (pathname !== '/pastEvents') && (pathname !== '/upcomingEvents') &&
    !pathname.includes('/events') && !pathname.includes('/groups') && !pathname.includes('/community');

  const url = postLink || postGetPageUrl(post)

  const Icon = postIcon(post);

  const title = <span>
    {sticky && <span className={classes.sticky}>
      <ForumIcon icon="Pin" className={classes.stickyIcon} />
    </span>}
    {Icon && <Icon className={classes.primaryIcon}/>}

    {post.draft && showDraftTag && <span className={classes.tag}>[Draft]</span>}
    {post.isFuture && <span className={classes.tag}>[Pending]</span>}
    {post.unlisted && <span className={classes.tag}>[Unlisted]</span>}
    {shared && <span className={classes.tag}>[Shared]</span>}
    {post.isEvent && shouldRenderEventsTag && <span className={classes.tag}>[Event]</span>}

    <Wrapper>{post.title}</Wrapper>
  </span>

  return (
    <span className={classNames(
      classes.root,
      read && classes.read,
      wrap && classes.wrap,
      isOnGrayBackground && classes.onGrayBackground,
      strikethroughTitle && classes.strikethroughTitle,
      className,
    )}>
      {showIcons && curatedIconLeft && post.curatedDate && <span className={classes.leftCurated}>
        <InteractionWrapper className={classes.interactionWrapper}>
          <CuratedIcon hasColor />
        </InteractionWrapper>
      </span>}
      <span className={!wrap ? classes.eaTitleDesktopEllipsis : undefined}>
        {isLink ? <Link to={url} doOnDown={true} eventProps={linkEventProps}>{title}</Link> : title }
      </span>
      {showIcons && <span className={classes.hideXsDown}>
        <InteractionWrapper className={classes.interactionWrapper}>
          <PostsItemIcons 
            post={post} 
            hideCuratedIcon={curatedIconLeft} 
            hidePersonalIcon={!showPersonalIcon}
            hover={postItemHovered}
          />
        </InteractionWrapper>
      </span>}
    </span>
  )
}

export default PostsTitle;


