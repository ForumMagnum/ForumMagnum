import { registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import { isAF } from '../../lib/instanceSettings';

const styles = (theme: ThemeType) => ({
  root: {
    ...theme.typography.contentNotice,
    ...theme.typography.postStyle
  },
})

// This is deprecated, but we're keeping it around for now until we're sure we're not using it
const AlignmentCrosspostMessage = ({post, classes}: {
  post: PostsBase,
  classes: ClassesType<typeof styles>,
}) => {
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

export default registerComponent('AlignmentCrosspostMessage', AlignmentCrosspostMessage, {styles});


