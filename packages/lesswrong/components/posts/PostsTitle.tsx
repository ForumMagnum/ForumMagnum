import { registerComponent, Components } from '../../lib/vulcan-lib';
import React from 'react';
import classNames from 'classnames';
import { useCurrentUser } from "../common/withUser";
import { useLocation } from '../../lib/routeUtil';
import { Link } from '../../lib/reactRouterWrapper';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import { idSettingIcons, tagSettingIcons } from "../../lib/collections/posts/constants";
import { communityPath } from '../../lib/routes';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    color: theme.palette.text.normal,
    position: "relative",
    lineHeight: "1.8rem",
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
    fontFamily: theme.typography.postStyle.fontFamily,
    marginRight: theme.spacing.unit,
  },
  wrap: {
    whiteSpace: "normal",
  },
  sticky: {
    paddingLeft: 2,
    paddingRight: 10,
    position: "relative",
    top: 2,
    color: theme.palette.icon[theme.uiStyle === "friendly" ? "dim4" : "slightlyDim3"],
  },
  stickyIcon: theme.uiStyle === "friendly"
    ? {
      width: 16,
      height: 16,
    }
    : {},
  primaryIcon: {
    color: theme.palette.icon.dim55,
    paddingRight: theme.spacing.unit,
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
  hideSmDown: { // TODO FIX NAME
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
  strikethroughTitle: {
    textDecoration: "line-through"
  },
})

const postIcon = (post: PostsBase|PostsListBase) => {
  const matchingIdSetting = Array.from(idSettingIcons.keys()).find(idSetting => post._id === idSetting.get())
  if (matchingIdSetting) {
    return idSettingIcons.get(matchingIdSetting);
  }
  const tagSettingIconKeys = Array.from(tagSettingIcons.keys())
  //Sometimes this function will be called with fragments that don't have the tag array, in that case assume that the tag array is empty
  const postTags = post.hasOwnProperty('tags') ? (post as PostsListBase).tags : [] 
  const matchingTagSetting = tagSettingIconKeys.find(tagSetting => (postTags).find(tag => tag._id === tagSetting.get()));
  if (matchingTagSetting) {
    return tagSettingIcons.get(matchingTagSetting);
  }
  return null;
}

const PostsTitle = ({
  post, 
  postLink, 
  classes, 
  sticky, 
  read, 
  showQuestionTag=true, 
  showPersonalIcon=true, 
  showLinkTag=true, 
  showDraftTag=true, 
  wrap=false, 
  showIcons=true, 
  isLink=true, 
  curatedIconLeft=true, 
  strikethroughTitle=false
}:{
  post: PostsBase|PostsListBase,
  postLink?: string,
  classes: ClassesType,
  sticky?: boolean,
  read?: boolean,
  showQuestionTag?: boolean,
  showPersonalIcon?: boolean
  showLinkTag?: boolean,
  showDraftTag?: boolean,
  wrap?: boolean,
  showIcons?: boolean,
  isLink?: boolean,
  curatedIconLeft?: boolean
  strikethroughTitle?: boolean
}) => {
  const currentUser = useCurrentUser();
  const { pathname } = useLocation();
  const { PostsItemIcons, CuratedIcon, ForumIcon } = Components

  const shared = post.draft && (post.userId !== currentUser?._id) && post.shareWithUsers

  // const shouldRenderQuestionTag = (pathname !== "/questions") && showQuestionTag
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

    <span>{post.title}</span>
  </span>

  return (
    <span className={classNames(classes.root, {
      [classes.read]: read,
      [classes.wrap]: wrap,
      [classes.strikethroughTitle]: strikethroughTitle
    })}>
      {showIcons && curatedIconLeft && post.curatedDate && <span className={classes.leftCurated}>
        <CuratedIcon/>
      </span>}
      {isLink ? <Link to={url}>{title}</Link> : title }
      {showIcons && <span className={classes.hideSmDown}>
        <PostsItemIcons post={post} hideCuratedIcon={curatedIconLeft} hidePersonalIcon={!showPersonalIcon}/>
      </span>}
    </span>
  )

}

const PostsTitleComponent = registerComponent('PostsTitle', PostsTitle, {styles});

declare global {
  interface ComponentTypes {
    PostsTitle: typeof PostsTitleComponent
  }
}
