import { registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import { isAF } from '../../lib/instanceSettings';
import LWTooltip from "../common/LWTooltip";

const AlignmentCrosspostLink = ({post}: {
  post: PostsBase,
}) => {
  if (post.af && !isAF) {
    return (
      <LWTooltip title={<div><p>This is an alignment forum post. <br/>May contain more technical jargon than usual.</p>
      <p>{post.afBaseScore} Ω karma</p></div>}>
        <a href={`https://alignmentforum.org/posts/${post._id}/${post.slug}`}>
          AI Alignment Forum 
        </a>
      </LWTooltip>
    );
  } else {
    return null
  }
}

export default registerComponent('AlignmentCrosspostLink', AlignmentCrosspostLink);


