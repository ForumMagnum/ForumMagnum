import { registerComponent, Components } from '../../lib/vulcan-lib';
import React from 'react';
import classNames from 'classnames';
import { useCurrentUser } from "../common/withUser";
import { useLocation } from '../../lib/routeUtil';
import { Link } from '../../lib/reactRouterWrapper';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import { userHasBoldPostItems } from '../../lib/betas';
import { idSettingIcons, tagSettingIcons } from "../../lib/collections/posts/constants";
import { communityPath } from '../../lib/routes';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    color: "rgba(0,0,0,.87)",
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
    fontSize: "1.3rem",
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
    paddingRight: theme.spacing.unit,
    position: "relative",
    top: 2
  },
  primaryIcon: {
    color: "rgba(0,0,0,.55)",
    paddingRight: theme.spacing.unit,
    top: -2,
    width: "auto",
    position: "relative",
    verticalAlign: "middle",
  },
  read: {
    color: "rgba(0,0,0,.55)",
    '&:hover': {
      color: "rgba(0,0,0,.87)",
    }
  },
  adminUnread: {
    fontWeight: 500,
    color: "rgba(0,0,0,.87)",
    textShadow: "0.2px 0.2px 0px rgba(0,0,0,.87)"
  },
  adminRead: {
    fontWeight: 500,
    opacity: 1,
    color: "rgba(0,0,0,.75)",
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
    marginRight: 6
  }
})

const stickyIcon = <svg fill="#000000" height="15" viewBox="0 0 10 15" width="10" xmlns="http://www.w3.org/2000/svg">
  <path d="M0 0h24v24H0z" fill="none"/>
  <path d="M 0.62965 7.43734C 0.504915 7.43692 0.383097 7.40021 0.279548 7.33183C 0.175999 7.26345 0.0953529 7.16646 0.0477722 7.05309C 0.000191541 6.93972 -0.0121941 6.81504 0.0121763 6.69475C 0.0365467 6.57447 0.0965826 6.46397 0.184718 6.37719L 1.77312 4.81248L 1.77312 1.75013L 1.32819 1.75013C 1.20359 1.75073 1.08025 1.72558 0.966163 1.67633C 0.852072 1.62708 0.749771 1.55483 0.665885 1.46423C 0.581999 1.37364 0.518398 1.26674 0.479198 1.15045C 0.439999 1.03415 0.426075 0.91106 0.438329 0.789139C 0.466198 0.56792 0.576593 0.364748 0.748122 0.218993C 0.919651 0.0732386 1.1401 -0.00472087 1.36675 0.000221379L 8.00217 0.000221379C 8.12677 -0.000372526 8.25011 0.0247692 8.3642 0.0740189C 8.47829 0.123269 8.58059 0.195528 8.66448 0.286119C 8.74837 0.37671 8.81197 0.483614 8.85117 0.599907C 8.89037 0.716201 8.90429 0.839293 8.89204 0.961214C 8.86417 1.18243 8.75377 1.38561 8.58224 1.53136C 8.41071 1.67711 8.19026 1.75507 7.96361 1.75013L 7.55724 1.75013L 7.55724 4.81248L 9.14861 6.37719C 9.23675 6.46397 9.29679 6.57447 9.32116 6.69475C 9.34553 6.81504 9.33314 6.93972 9.28556 7.05309C 9.23798 7.16646 9.15733 7.26345 9.05378 7.33183C 8.95023 7.40021 8.82842 7.43692 8.70368 7.43734L 0.62965 7.43734ZM 4.16834 13.562C 4.18174 13.6824 4.23985 13.7937 4.33154 13.8745C 4.42323 13.9553 4.54204 14 4.66518 14C 4.78833 14 4.90713 13.9553 4.99882 13.8745C 5.09051 13.7937 5.14863 13.6824 5.16202 13.562L 5.73747 8.74977L 3.5929 8.74977L 4.16834 13.562Z"/>
</svg>

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

const PostsTitle = ({post, postLink, classes, sticky, read, showQuestionTag=true, showLinkTag=true, showDraftTag=true, wrap=false, showIcons=true, isLink=true, curatedIconLeft=true}: {
  post: PostsBase|PostsListBase,
  postLink?: string,
  classes: ClassesType,
  sticky?: boolean,
  read?: boolean,
  showQuestionTag?: boolean,
  showLinkTag?: boolean,
  showDraftTag?: boolean,
  wrap?: boolean,
  showIcons?: boolean,
  isLink?: boolean,
  curatedIconLeft?: boolean
}) => {
  const currentUser = useCurrentUser();
  const { pathname } = useLocation();
  const { PostsItemIcons, CuratedIcon } = Components

  const shared = post.draft && (post.userId !== currentUser?._id) && post.shareWithUsers

  // const shouldRenderQuestionTag = (pathname !== "/questions") && showQuestionTag
  const shouldRenderEventsTag = (pathname !== communityPath) && (pathname !== '/pastEvents') && (pathname !== '/upcomingEvents') &&
    !pathname.includes('/events') && !pathname.includes('/groups');

  const url = postLink || postGetPageUrl(post)
  
  const Icon = postIcon(post);

  const title = <span>
    {Icon && <Icon className={classes.primaryIcon}/>}
    {sticky && <span className={classes.sticky}>{stickyIcon}</span>}

    {post.draft && showDraftTag && <span className={classes.tag}>[Draft]</span>}
    {post.unlisted && <span className={classes.tag}>[Unlisted]</span>}
    {shared && <span className={classes.tag}>[Shared]</span>}
    {post.isEvent && shouldRenderEventsTag && <span className={classes.tag}>[Event]</span>}

    <span>{post.title}</span>
  </span>

  return (
    <span className={classNames(classes.root, {
      [classes.read]: read,
      [classes.wrap]: wrap,
      [classes.adminUnread]: !read && userHasBoldPostItems(currentUser),
      [classes.adminRead]: read && userHasBoldPostItems(currentUser),
    })}>
      {showIcons && curatedIconLeft && post.curatedDate && <span className={classes.leftCurated}>
        <CuratedIcon/>
      </span>}
      {isLink ? <Link to={url}>{title}</Link> : title }
      {showIcons && <span className={classes.hideSmDown}>
        <PostsItemIcons post={post} hideCuratedIcon={curatedIconLeft}/>
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
