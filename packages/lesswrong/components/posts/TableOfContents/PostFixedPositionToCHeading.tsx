import React from 'react';
import { Components, registerComponent } from '@/lib/vulcan-lib/components';

const styles = (theme: ThemeType) => ({
  wordCount: {
    marginLeft: 12,
    marginBottom: 12,
    fontFamily: theme.palette.fonts.sansSerifStack,
    color: theme.palette.greyAlpha(0.5),
  },
})

const PostFixedPositionToCHeading = ({post, classes}: {
  post: PostsListWithVotes
  classes: ClassesType,
}) => {
  const wordCount = post.contents?.wordCount
  return <div className={classes.wordCount}>{wordCount} words</div>
}

const FixedPositionToCHeadingComponent = registerComponent('PostFixedPositionToCHeading', PostFixedPositionToCHeading, {styles});

declare global {
  interface ComponentTypes {
    PostFixedPositionToCHeading: typeof FixedPositionToCHeadingComponent
  }
}

