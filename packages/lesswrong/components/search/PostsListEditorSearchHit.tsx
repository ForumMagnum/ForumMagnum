import React from 'react';
import { Components, registerComponent} from '../../lib/vulcan-lib';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import { Link } from '../../lib/reactRouterWrapper';
import type { Hit } from 'react-instantsearch-core';
import { isFriendlyUI } from '../../themes/forumTheme';

const styles = (theme: ThemeType) => ({
  root: {
    padding: theme.spacing.unit,
    borderBottom: "solid 1px",
    borderBottomColor: theme.palette.grey[200],
    '&:hover': {
      backgroundColor: theme.palette.grey[100],
    },
  },
  postLink: {
    float:"right",
    marginRight: theme.spacing.unit,
    fontFamily: isFriendlyUI ? theme.palette.fonts.sansSerifStack : undefined,
  },
  titleRow: {
    textOverflow: "ellipsis",
    overflow: "hidden",
  },
  metadataRow: {
  },
})

const PostsListEditorSearchHit = ({hit, classes}: {
  hit: Hit<AnyBecauseTodo>,
  classes: ClassesType<typeof styles>,
}) => {
  const post = hit as SearchPost;
  const {PostsTooltip, PostsTitle, MetaInfo, FormatDate} = Components;
  return (
    <PostsTooltip postId={post._id} postsList placement="left">
      <div className={classes.root}>
        <div className={classes.titleRow}>
          <PostsTitle post={post as unknown as PostsListBase} isLink={false} />
        </div>
        <div className={classes.metadataRow}>
          {post.authorDisplayName && <MetaInfo>
            {post.authorDisplayName}
          </MetaInfo>}
          <MetaInfo>
            {post.baseScore} karma
          </MetaInfo>
          {post.postedAt && <MetaInfo>
            <FormatDate date={post.postedAt} />
          </MetaInfo>}
          <Link to={postGetPageUrl(post)} className={classes.postLink}>
            (Link)
          </Link>
        </div>
      </div>
    </PostsTooltip>
  );
}

const PostsListEditorSearchHitComponent = registerComponent("PostsListEditorSearchHit", PostsListEditorSearchHit, {styles});

declare global {
  interface ComponentTypes {
    PostsListEditorSearchHit: typeof PostsListEditorSearchHitComponent
  }
}
