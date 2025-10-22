import { registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import LWTooltip from "../common/LWTooltip";
import { useForumType } from '../hooks/useForumType';

const AlignmentCrosspostLink = ({post}: {
  post: PostsBase,
}) => {
  const { isAF } = useForumType();
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


