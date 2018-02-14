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
    <p><b>Sitewide commenting guidelines:</b></p>
    <p>
      <em>Aim to explain, not persuade.</em> Write your true reasons for believing something, as opposed to the reasons you think are most likely to persuade readers of your comments. Try to offer concrete models, make predictions, and note what would change your mind.
    </p>
    <p>
      <em>Avoid identity politics.</em> Make personal statements instead of statements that try to represent a group consensus (“I think X is wrong” vs. “X is generally frowned upon”). Avoid stereotypical arguments that will cause others to round <em>you</em> off to someone else they’ve encountered before. Tell people how you think about a topic, instead of repeating someone else’s arguments (e.g. “But Nick Bostrom says…”).
    </p>
    <p>
      <em>Get curious.</em> If I disagree with someone, what might they be thinking; what are the moving parts of their beliefs? What model do I think they are running? Ask yourself - what about this topic do I not understand? What evidence could I get, or what evidence do I already have?
    </p>

  </div>}
  {user && user.moderatorAssistance && showModeratorAssistance &&
    <p className="moderation-guidelines-box-assistance">
      <em>LW2 moderators are assisting in the moderation of this post</em>
    </p> }
</div>

registerComponent('ModerationGuidelinesContent', ModerationGuidelinesContent);
