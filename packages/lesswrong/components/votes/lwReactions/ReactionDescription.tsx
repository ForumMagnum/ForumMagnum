import React from 'react';
import { registerComponent } from '../../../lib/vulcan-lib/components';
import type { NamesAttachedReactionType } from '../../../lib/voting/reactions';

const ReactionDescriptionInner = ({reaction, contentType="comment", className}: {
  reaction: NamesAttachedReactionType,
  contentType?: string
  className?: string,
}) => {
  if (!reaction.description) {
    return null;
  } else if (typeof reaction.description === "string") {
    return <div className={className}>{reaction.description}</div>
  } else if (typeof reaction.description === "function") {
    return <div className={className}>{reaction.description(contentType)}</div>
  } else {
    return <div className={className}>{reaction.description}</div>
  }
}

export const ReactionDescription = registerComponent('ReactionDescription', ReactionDescriptionInner);



