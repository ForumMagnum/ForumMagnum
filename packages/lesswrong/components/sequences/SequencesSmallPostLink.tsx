import React from 'react';
import { Link } from '../../lib/reactRouterWrapper';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import classNames from 'classnames';
import type { Placement as PopperPlacementType } from "popper.js"
import PostsTooltip from "../posts/PostsPreviewTooltip/PostsTooltip";
import PostReadCheckbox from "../posts/PostReadCheckbox";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles("SequencesSmallPostLink", (theme: ThemeType) => ({
  title: {
    position: "relative",
    flexGrow: 1,
    ...theme.typography.body2,
    ...theme.typography.postStyle,
    color: theme.palette.grey[900],
    display: "flex",
    alignItems: "center",
    marginBottom: 6,
    marginTop: 6
  },
  large: {
    ...theme.typography.postsItemTitle,
    marginBottom: 10,
    marginTop: 10
  },
  checkbox: {
    position: "relative",
    top: 1,
    marginRight: 10
  }
}));

const SequencesSmallPostLink = ({post, sequenceSlug, large, placement="left-start"}: {
  post: ChapterPostSlim | PostsList,
  sequenceSlug: string,
  large?: boolean,
  placement?: PopperPlacementType,
}) => {
  const classes = useStyles(styles);

  return <div className={classNames(classes.title, {[classes.large]: large})}>
    <span className={classes.checkbox}>
      <PostReadCheckbox post={post} />
    </span>
    <PostsTooltip
      {...('contents' in post ? { post } : { postId: post._id, preload: 'on-screen' })}
      postsList={true}
      placement={placement}
      inlineBlock={false}
      clickable
    >
      <Link to={postGetPageUrl(post, { isAbsolute: false, sequenceSlug })}>
        {post.title}
      </Link>
    </PostsTooltip>
  </div>
}

export default SequencesSmallPostLink;


