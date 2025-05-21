import { registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import MetaInfo from "../common/MetaInfo";

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

export default registerComponent('PostsStats', PostsStats, {styles});


