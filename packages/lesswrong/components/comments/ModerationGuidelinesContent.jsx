import { Components, registerComponent } from 'meteor/vulcan:core';
import React, { PureComponent } from 'react';

const ModerationGuidelinesContent = ({ user, showFrontpageGuidelines = true, showModeratorAssistance = true }) => <div className="moderation-guidelines-box-content comments-item-text">
  {user && user.moderationGuidelines &&
    <div>
      <p><b>The author of this post has specified the following moderation guidelines:</b></p>
      <p>{user.moderationGuidelines}</p>
    </div>
  }
  {showFrontpageGuidelines && <div>
    <p><b>Sitewide content guidelines:</b></p>
    <p>
      1.1. Usefulness, novelty, and fun. The frontpage of this site is for serious intellectual engagement with interesting ideas, with a focus on ideas that are important but challenging to evaluate. Topics that lack inherent importance are OK if the discussion quality is high enough, and particularly if the discussion is useful for other purposes, like building skills; but the best topics will usually be consequential and neglected ones.
    </p>
    <p>
      1.2. Accuracy, kindness, and relevance to the discussion at hand, in the spirit of the Victorian Sufi Buddha ideal.
    </p>
    <p>
      1.3. Clarity and openness about what you believe, your reasons for believing it, and what would cause you to change your mind. Try to make concrete predictions and bets, and to note the cruxes for your beliefs, where possible. It’s not always easy to clearly articulate a belief, and it's great to note places where you’re uncertain about what you believe, about your reasons, and about your cruxes. We don’t want people to feel like they have to conceal or immediately abandon their beliefs whenever those beliefs turn out to be nontrivial to articulate or justify. But incremental progress toward more clarity and openness, even if it’s incomplete, is highly valued here.
    </p>
  </div>}
  {user && user.moderatorAssistance && showModeratorAssistance &&
    <p className="moderation-guidelines-box-assistance">
      <em>LW2 moderators are assisting in the moderation of this post</em>
    </p> }
</div>

registerComponent('ModerationGuidelinesContent', ModerationGuidelinesContent);
