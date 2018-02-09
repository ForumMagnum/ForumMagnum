import { Components, registerComponent, withDocument} from 'meteor/vulcan:core';
import React from 'react';
import { FormattedMessage } from 'meteor/vulcan:i18n';

const ModerationGuidelinesBox = (props) => {
  if (props.user && props.user.moderationStyle) {
    const { moderationStyle, moderationGuidelines, moderatorAssistance } = props.user;
    return <div className={"moderation-guidelines-box " + moderationStyle}>

      <span className="moderation-guidelines-header">
        <span>Moderation Guidelines: </span>
        <FormattedMessage id={"moderation-" + moderationStyle} />
      </span>
      {moderationGuidelines}
      {moderatorAssistance && props.showModeratorAssistance &&
        <div className="moderation-guidelines-box-assistance">
          LW2 moderators are assisting in the moderation of this post
        </div>}
    </div>
  } else {
    return null
  }
};

registerComponent('ModerationGuidelinesBox', ModerationGuidelinesBox);
