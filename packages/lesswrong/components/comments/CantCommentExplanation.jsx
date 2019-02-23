import React from 'react';
import { registerComponent, getSetting } from 'meteor/vulcan:core';
import withUser from '../common/withUser';
import Users from 'meteor/vulcan:users';

const CantCommentExplanation = ({currentUser, post}) =>
  <div className="i18n-message author_has_banned_you">
    { Users.blockedCommentingReason(currentUser, post)}
    { !(getSetting('AlignmentForum', false)) && <span>
      (Questions? Send an email to <a className="email-link" href="mailto:moderation@lesserwrong.com">moderation@lesserwrong.com</a>)
    </span> }
  </div>

registerComponent('CantCommentExplanation', CantCommentExplanation, withUser);