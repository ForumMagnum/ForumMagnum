import React, { CSSProperties, FC, PropsWithChildren } from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import classNames from 'classnames';
import { useCurrentUser } from "../common/withUser";
import { useLocation } from '../../lib/routeUtil';
import { Link } from '../../lib/reactRouterWrapper';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import { idSettingIcons, tagSettingIcons } from "../../lib/collections/posts/constants";
import { communityPath } from '../../lib/routes';
import { InteractionWrapper } from '../common/useClickableCell';
import { isFriendlyUI } from '../../themes/forumTheme';
import { smallTagTextStyle, tagStyle } from '../tagging/FooterTag';
import { useCurrentForumEvent } from '../hooks/useCurrentForumEvent';
import { tagGetUrl } from '../../lib/collections/tags/helpers';

const styles = (theme: ThemeType) => ({
  root: {
    color: theme.palette.text.normal,
    position: "relative",
    lineHeight: "1.7rem",
    fontWeight: isFriendlyUI ? 600 : undefined,
    fontFamily: isFriendlyUI ? theme.palette.fonts.sansSerifStack : theme.typography.postStyle.fontFamily,
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
    marginRight: theme.spacing.unit,
  },
  wrap: {
    whiteSpace: "normal",
  },
  sticky: {
    paddingLeft: isFriendlyUI ? 2 : undefined,
    paddingRight: isFriendlyUI ? 8 : 10,
    position: "relative",
    top: 2,
    color: theme.palette.icon["dim4"],
  },
  stickyIcon: isFriendlyUI
    ? {
      width: 16,
      height: 16,
      padding: 1.5,
      color: theme.palette.primary.main,
    }
    : {
      fontSize: "1.2rem",
    },
  primaryIcon: {
    color: theme.palette.icon.dim55,
    paddingRight: theme.spacing.unit,
    top: -2,
    width: isFriendlyUI ? 26 : "auto",
    position: "relative",
    verticalAlign: "middle",
  },
  read: {
    color: theme.palette.text.dim55,
    '&:hover': {
      color: theme.palette.text.normal,
    }
  },
  eaTitleDesktopEllipsis: isFriendlyUI ? {
    '&:hover': {
      opacity: 0.5
    },
    '& a': {
      opacity: 1
    },
    [theme.breakpoints.up("sm")]: {
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
    },
  } : {},
  hideXsDown: {
    [theme.breakpoints.down('xs')]: {
      display: "none",
    }
  },
  tag: {
    marginRight: theme.spacing.unit
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
  eventTag: {
    ...tagStyle(theme),
    ...smallTagTextStyle(theme),
    display: "inline-flex",
    alignItems: "center",
    marginLeft: 10,
    padding: "0 6px",
    height: 20,
    border: "none",
    backgroundColor: theme.themeOptions.name === "dark"
      ? "var(--post-title-tag-foreground)"
      : "var(--post-title-tag-background)",
    color: theme.themeOptions.name === "dark"
      ? "var(--post-title-tag-background)"
      : "var(--post-title-tag-foreground)",
    "&:hover": {
      opacity: 0.9,
    },
  },
  highlightedTagTooltip: {
    marginTop: -2,
  },
});

const postIcon = (post: PostsBase|PostsListBase) => {
  const matchingIdSetting = Array.from(idSettingIcons.keys()).find(idSetting => post._id === idSetting.get())
  if (matchingIdSetting) {
    return idSettingIcons.get(matchingIdSetting);
  }
  const tagSettingIconKeys = Array.from(tagSettingIcons.keys())
  //Sometimes this function will be called with fragments that don't have the tag array, in that case assume that the tag array is empty
  const postTags = post.hasOwnProperty('tags') ? (post as PostsListBase).tags : []
  if (!postTags) return null
  const matchingTagSetting = tagSettingIconKeys.find(tagSetting => (postTags).find(tag => tag._id === tagSetting.get()));
  if (matchingTagSetting) {
    return tagSettingIcons.get(matchingTagSetting);
  }
  return null;
}

const DefaultWrapper: FC<PropsWithChildren<{}>> = ({children}) => <>{children}</>;

const PostsTitle = ({
  post, 
  postLink, 
  sticky, 
  read, 
  showPersonalIcon=true, 
  showDraftTag=true, 
  wrap=false, 
  showIcons=true,
  isLink=true,
  curatedIconLeft=true,
  strikethroughTitle=false,
  showRecommendationIcon=false,
  Wrapper=DefaultWrapper,
  showEventTag,
  linkEventProps,
  className,
  classes,
}: {
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
  showRecommendationIcon?: boolean
  Wrapper?: FC<PropsWithChildren<{}>>,
  showEventTag?: boolean,
  linkEventProps?: Record<string, string>,
  className?: string,
  classes: ClassesType<typeof styles>,
}) => {
  const currentUser = useCurrentUser();
  const { pathname } = useLocation();
  const {currentForumEvent, isEventPost} = useCurrentForumEvent();
  const { PostsItemIcons, CuratedIcon, ForumIcon, TagsTooltip } = Components;

  const shared = post.draft && (post.userId !== currentUser?._id) && post.shareWithUsers

  const shouldRenderEventsTag = (pathname !== communityPath) && (pathname !== '/pastEvents') && (pathname !== '/upcomingEvents') &&
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
      strikethroughTitle && classes.strikethroughTitle,
      className,
    )}>
      {showIcons && curatedIconLeft && post.curatedDate && <span className={classes.leftCurated}>
        <InteractionWrapper className={classes.interactionWrapper}>
          <CuratedIcon hasColor />
        </InteractionWrapper>
      </span>}
      <span className={!wrap ? classes.eaTitleDesktopEllipsis : undefined}>
        {isLink ? <Link to={url} eventProps={linkEventProps}>{title}</Link> : title }
      </span>
      {showIcons && <span className={classes.hideXsDown}>
        <InteractionWrapper className={classes.interactionWrapper}>
          <PostsItemIcons 
            post={post} 
            hideCuratedIcon={curatedIconLeft} 
            hidePersonalIcon={!showPersonalIcon}
            showRecommendationIcon={showRecommendationIcon}
          />
        </InteractionWrapper>
      </span>}
      {showEventTag && currentForumEvent?.tag && isEventPost(post) &&
        <InteractionWrapper className={classes.interactionWrapper}>
          <TagsTooltip
            tagSlug={currentForumEvent.tag.slug}
            className={classes.highlightedTagTooltip}
          >
            <Link to={tagGetUrl(currentForumEvent.tag)}>
              <span
                className={classes.eventTag}
                style={{
                  "--post-title-tag-background": currentForumEvent.lightColor,
                  "--post-title-tag-foreground": currentForumEvent.darkColor,
                } as CSSProperties}
              >
                {currentForumEvent.tag.name}
              </span>
            </Link>
          </TagsTooltip>
        </InteractionWrapper>
      }
    </span>
  )
}

const PostsTitleComponent = registerComponent('PostsTitle', PostsTitle, {styles});

declare global {
  interface ComponentTypes {
    PostsTitle: typeof PostsTitleComponent
  }
}
