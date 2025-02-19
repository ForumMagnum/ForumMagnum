import React from 'react';
import { registerComponent } from '../../../lib/vulcan-lib';
import type { NamesAttachedReactionType } from '../../../lib/voting/reactions';

const ReactionDescription = ({reaction, contentType="comment", className}: {
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

const ReactionDescriptionComponent = registerComponent('ReactionDescription', ReactionDescription);

declare global {
  interface ComponentTypes {
    ReactionDescription: typeof ReactionDescriptionComponent
  }
}

