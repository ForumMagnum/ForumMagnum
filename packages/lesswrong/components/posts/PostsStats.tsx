import { registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import MetaInfo from "../common/MetaInfo";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles('PostsStats', (theme: ThemeType) => ({
  root: {
    opacity:.5,
    [theme.breakpoints.down('sm')]: {
      display:"none"
    }
  }
}))

const PostsStats = ({post}: {
  post: PostsDetails,
}) => {
  const classes = useStyles(styles);

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

export default PostsStats


