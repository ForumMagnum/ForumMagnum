import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { Link } from '../../lib/reactRouterWrapper';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import classNames from 'classnames';
import type { PopperPlacementType } from '@/lib/vendor/@material-ui/core/src/Popper/Popper';
import { isLWorAF } from '../../lib/instanceSettings';
import { isFriendlyUI } from '../../themes/forumTheme';

const styles = (theme: ThemeType) => ({
  title: {
    position: "relative",
    flexGrow: 1,
    ...theme.typography.body2,
    ...theme.typography.postStyle,
    color: theme.palette.grey[900],
    display: "flex",
    alignItems: isFriendlyUI ? "flex-start" : "center",
    marginBottom: 6,
    marginTop: 6,
    ...(isFriendlyUI && {
      fontFamily: theme.palette.fonts.sansSerifStack,
      fontSize: 14,
      fontWeight: 500,
      lineHeight: "150%",
    }),
  },
  large: {
    ...theme.typography.postsItemTitle,
    marginBottom: 10,
    marginTop: 10
  },
  checkbox: {
    position: "relative",
    top: isFriendlyUI ? -1 : 1,
    marginRight: 10
  }
});

const SequencesSmallPostLink = ({classes, post, sequenceId, large, placement="left-start"}: {
  classes: ClassesType<typeof styles>,
  post: PostsList,
  sequenceId: string,
  large?: boolean,
  placement?: PopperPlacementType,
}) => {
  const {PostsTooltip, PostReadCheckbox} = Components;
  return <div className={classNames(classes.title, {[classes.large]: large})}>
    <span className={classes.checkbox}>
      <PostReadCheckbox
        post={post}
        width={isFriendlyUI ? 14 : undefined}
      />
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
