import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useHover } from '../common/withHover';
import { Link } from '../../lib/reactRouterWrapper';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import classNames from 'classnames';
import { isEAForum } from '../../lib/instanceSettings';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    display: "flex",
    ...theme.typography.body2,
    ...theme.typography.postStyle,
    fontSize: "1.1rem",
    color: theme.palette.grey[900],
  },
  karma: {
    marginLeft: 4,
    marginRight: 12,
    textAlign: "center",
    width: 20,
    flexShrink: 0,
  },
  post: {
    display: "flex",
    width: "100%",
    justifyContent: "space-between",
    marginTop: 2,
    marginBottom: 2,
  },
  title: {
    ...(isEAForum
      ? {
        fontFamily: theme.palette.fonts.sansSerifStack,
        fontWeight: 600,
      }
      : {
        position: "relative",
      }),
    top: 2,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    flexGrow: 1,
    color: theme.palette.lwTertiary.dark
  },
  wrap: {
    whiteSpace: "unset",
    lineHeight: "1.1em",
    marginBottom: 4,
  },
  author: {
    marginRight: 0,
    marginLeft: 20,
  },
  widerSpacing: {
    marginBottom: 4
  }
});

const TagSmallPostLink = ({classes, post, hideMeta, wrap, widerSpacing}: {
  classes: ClassesType,
  post: PostsList,
  hideMeta?: boolean,
  wrap?: boolean,
  widerSpacing?: boolean
}) => {
  const { LWPopper, PostsPreviewTooltip, UsersName, MetaInfo, PostsItemKarma } = Components
  const { eventHandlers, hover, anchorEl } = useHover();

  return <span {...eventHandlers}>
    <div className={classNames(classes.root, {[classes.widerSpacing]: widerSpacing})}>
      <LWPopper 
        open={hover} 
        anchorEl={anchorEl} 
        placement="left-start"
        allowOverflow
      >
        <PostsPreviewTooltip post={post}/>
      </LWPopper>
      <div className={classes.post}>
        {!hideMeta && <MetaInfo className={classes.karma}>
          <PostsItemKarma post={post} placement="right"/>
        </MetaInfo>}
        <Link to={postGetPageUrl(post)} className={classNames(classes.title, {[classes.wrap]: wrap})}>
          {post.title}
        </Link>
        {!hideMeta && post.user && <MetaInfo className={classes.author}>
          <UsersName user={post.user} />
        </MetaInfo>}


      </div>
    </div>
  </span>
}

const TagSmallPostLinkComponent = registerComponent("TagSmallPostLink", TagSmallPostLink, {styles});

declare global {
  interface ComponentTypes {
    TagSmallPostLink: typeof TagSmallPostLinkComponent
  }
}

