import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { KARMA_WIDTH } from './LWPostsItem';

const styles = (_theme: ThemeType) => ({
  root: {
    display: "flex",
    marginBottom: 2,
  },
  karma: {
    width: KARMA_WIDTH,
    marginRight: 8
  }
});

const PingbackInner = ({classes, post}: {
  classes: ClassesType<typeof styles>,
  post: PostsList,
}) => {
  const {PostsTooltip, PostsItem2MetaInfo, KarmaDisplay, PostsTitle} = Components;
  return (
    <div className={classes.root}>
      <PostsItem2MetaInfo className={classes.karma}>
        <KarmaDisplay document={post} />
      </PostsItem2MetaInfo>
      <PostsTooltip post={post} placement="bottom-end" clickable>
        <PostsTitle post={post} read={!!post.lastVisitedAt} showIcons={false} wrap />
      </PostsTooltip>
    </div>
  );
}

export const Pingback = registerComponent("Pingback", PingbackInner, {styles});

declare global {
  interface ComponentTypes {
    Pingback: typeof Pingback
  }
}

