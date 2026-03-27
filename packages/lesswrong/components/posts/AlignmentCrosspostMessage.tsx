import React from 'react';
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';
import { useForumType } from '../hooks/useForumType';

const styles = defineStyles('AlignmentCrosspostMessage', (theme: ThemeType) => ({
  root: {
    ...theme.typography.contentNotice,
    ...theme.typography.postStyle
  },
}))

// This is deprecated, but we're keeping it around for now until we're sure we're not using it
const AlignmentCrosspostMessage = ({post}: {
  post: PostsBase,
}) => {
  const classes = useStyles(styles);
  const { isAF } = useForumType();

  if (post.af && !isAF) {
    return (
      <div className={classes.root}>
        Crossposted from the <a href={`https://alignmentforum.org/posts/${post._id}/${post.slug}`}>AI Alignment Forum</a>. May contain more technical jargon than usual.
      </div>
    );
  } else {
    return null
  }
}

export default AlignmentCrosspostMessage;


