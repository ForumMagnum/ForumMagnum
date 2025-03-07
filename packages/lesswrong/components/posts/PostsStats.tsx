import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';

const styles = (theme: ThemeType) => ({
  root: {
    opacity:.5,
    [theme.breakpoints.down('sm')]: {
      display:"none"
    }
  }
})

const PostsStats = ({post, classes}: {
  post: PostsDetails,
  classes: ClassesType<typeof styles>,
}) => {
  const { MetaInfo } = Components;
  return (
    <span className={classes.root}>
      {post.score &&
        <MetaInfo title="Score">
          {Math.floor(post.score*10000)/10000}
        </MetaInfo>
      }
      <MetaInfo title="Views">
        {post.viewCount || 0}
      </MetaInfo>
    </span>
  )
}

const PostsStatsComponent = registerComponent('PostsStats', PostsStats, {styles});

declare global {
  interface ComponentTypes {
    PostsStats: typeof PostsStatsComponent
  }
}
