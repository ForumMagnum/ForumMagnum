import React from 'react';
import { registerComponent } from '@/lib/vulcan-lib/components';
import { LWTooltip } from "../../common/LWTooltip";

const styles = (theme: ThemeType) => ({
  readTime: {
    marginLeft: 12,
    marginBottom: 12,
    fontFamily: theme.palette.fonts.sansSerifStack,
    color: theme.palette.greyAlpha(0.5),
  },
})



const PostFixedPositionToCHeadingInner = ({post, classes}: {
  post: PostsListWithVotes,
  classes: ClassesType<typeof styles>,
}) => {
  const wordCount = post.contents?.wordCount;

  const readTime = <div className={classes.readTime}>{post.readTimeMinutes} min read</div>

  if (!wordCount) return readTime;

  return <LWTooltip title={`${Number(wordCount.toPrecision(2)).toLocaleString()} words`}>
    {readTime}
  </LWTooltip>
}

export const FixedPositionToCHeading = registerComponent('PostFixedPositionToCHeading', PostFixedPositionToCHeadingInner, {styles});

declare global {
  interface ComponentTypes {
    PostFixedPositionToCHeading: typeof FixedPositionToCHeading
  }
}

