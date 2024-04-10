import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { KARMA_WIDTH } from './LWPostsItem';

const styles = (_theme: ThemeType): JssStyles => ({
  root: {
    display: "flex",
    marginBottom: 2,
  },
  karma: {
    width: KARMA_WIDTH,
    marginRight: 8
  }
});

const Pingback = ({classes, post}: {
  classes: ClassesType,
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

const PingbackComponent = registerComponent("Pingback", Pingback, {styles});

declare global {
  interface ComponentTypes {
    Pingback: typeof PingbackComponent
  }
}

