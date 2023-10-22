import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { Link } from '../../lib/reactRouterWrapper';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import classNames from 'classnames';
import type { PopperPlacementType } from '@material-ui/core/Popper/Popper';
import { isEAForum, isLWorAF } from '../../lib/instanceSettings';

const styles = (theme: ThemeType): JssStyles => ({
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
});

const SequencesSmallPostLink = ({classes, post, sequenceId, large, placement="left-start"}: {
  classes: ClassesType,
  post: PostsList,
  sequenceId: string,
  large?: boolean,
  placement?: PopperPlacementType,
}) => {
  const {PostsTooltip, PostReadCheckbox} = Components;
  return <div className={classNames(classes.title, {[classes.large]: large})}>
    <span className={classes.checkbox}>
      <PostReadCheckbox post={post} />
    </span>
    <PostsTooltip
      post={post}
      postsList={isLWorAF}
      placement={placement}
      inlineBlock={false}
      clickable
    >
      <Link to={postGetPageUrl(post, false, sequenceId)}>
        {post.title}
      </Link>
    </PostsTooltip>
  </div>
}

const SequencesSmallPostLinkComponent = registerComponent("SequencesSmallPostLink", SequencesSmallPostLink, {styles});

declare global {
  interface ComponentTypes {
    SequencesSmallPostLink: typeof SequencesSmallPostLinkComponent
  }
}
