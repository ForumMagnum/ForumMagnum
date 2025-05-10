import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { Link } from '../../lib/reactRouterWrapper';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import classNames from 'classnames';
import { isFriendlyUI } from '../../themes/forumTheme';
import { PostsTooltip } from "../posts/PostsPreviewTooltip/PostsTooltip";
import { UsersName } from "../users/UsersName";
import { MetaInfo } from "../common/MetaInfo";
import { KarmaDisplay } from "../common/KarmaDisplay";

const styles = (theme: ThemeType) => ({
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
    ...(isFriendlyUI
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
    ...(isFriendlyUI && {
      lineHeight: '1.2em'
    }),
  },
  author: {
    marginRight: 0,
    marginLeft: 20,
  },
  widerSpacing: {
    marginBottom: 4
  }
});

const TagSmallPostLinkInner = ({classes, post, hideMeta, hideAuthor, wrap, widerSpacing, disableHoverPreview}: {
  classes: ClassesType<typeof styles>,
  post: PostsList,
  hideMeta?: boolean,
  hideAuthor?: boolean,
  wrap?: boolean,
  widerSpacing?: boolean
  disableHoverPreview?: boolean
}) => {
  return (
    <PostsTooltip post={post} clickable={false} placement="bottom-start" disabled={disableHoverPreview}>
      <div className={classNames(classes.root, {[classes.widerSpacing]: widerSpacing})}>
        <div className={classes.post}>
          {!hideMeta &&
            <MetaInfo className={classes.karma}>
              <KarmaDisplay document={post} placement="right" />
            </MetaInfo>
          }
          <Link
            to={postGetPageUrl(post)}
            className={classNames(classes.title, {[classes.wrap]: wrap})}
          >
            {post.title}
          </Link>
          {!hideMeta && !hideAuthor && post.user &&
            <MetaInfo className={classes.author}>
              <UsersName user={post.user} nowrap={!wrap} />
            </MetaInfo>
          }
        </div>
      </div>
    </PostsTooltip>
  );
}

export const TagSmallPostLink = registerComponent("TagSmallPostLink", TagSmallPostLinkInner, {styles});


