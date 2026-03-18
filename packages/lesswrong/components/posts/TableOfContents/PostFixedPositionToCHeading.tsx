import React from 'react';
import LWTooltip from "../../common/LWTooltip";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles('PostFixedPositionToCHeading', (theme: ThemeType) => ({
  readTime: {
    marginLeft: 12,
    marginBottom: 12,
    fontFamily: theme.palette.fonts.sansSerifStack,
    color: theme.palette.greyAlpha(0.5),
  },
}))



const PostFixedPositionToCHeading = ({post}: {
  post: PostsListWithVotes,
}) => {
  const classes = useStyles(styles);
  const wordCount = post.contents?.wordCount;

  const readTime = <div className={classes.readTime}>{post.readTimeMinutes} min read</div>

  if (!wordCount) return readTime;

  return <LWTooltip title={`${Number(wordCount.toPrecision(2)).toLocaleString()} words`}>
    {readTime}
  </LWTooltip>
}

export default PostFixedPositionToCHeading;



