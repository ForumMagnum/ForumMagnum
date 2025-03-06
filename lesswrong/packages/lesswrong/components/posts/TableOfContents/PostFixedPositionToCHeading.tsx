import React from 'react';
import { Components, registerComponent } from '@/lib/vulcan-lib/components';

const styles = (theme: ThemeType) => ({
  readTime: {
    marginLeft: 12,
    marginBottom: 12,
    fontFamily: theme.palette.fonts.sansSerifStack,
    color: theme.palette.greyAlpha(0.5),
  },
})

const PostFixedPositionToCHeading = ({post, classes}: {
  post: PostsListWithVotes
  classes: ClassesType<typeof styles>,
}) => {
  return <div className={classes.readTime}>{post.readTimeMinutes} min read</div>
}

const FixedPositionToCHeadingComponent = registerComponent('PostFixedPositionToCHeading', PostFixedPositionToCHeading, {styles});

declare global {
  interface ComponentTypes {
    PostFixedPositionToCHeading: typeof FixedPositionToCHeadingComponent
  }
}

export default FixedPositionToCHeadingComponent;

