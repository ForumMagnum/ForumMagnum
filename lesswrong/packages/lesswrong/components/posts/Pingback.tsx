import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { KARMA_WIDTH } from './LWPostsItem';
import PostsTooltip from "@/components/posts/PostsPreviewTooltip/PostsTooltip";
import PostsItem2MetaInfo from "@/components/posts/PostsItem2MetaInfo";
import KarmaDisplay from "@/components/common/KarmaDisplay";
import PostsTitle from "@/components/posts/PostsTitle";

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

const Pingback = ({classes, post}: {
  classes: ClassesType<typeof styles>,
  post: PostsList,
}) => {
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

export default PingbackComponent;

