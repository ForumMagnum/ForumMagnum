import React, { Component } from 'react';
import withUser from '../common/withUser';
import { Components, registerComponent, getSetting } from 'meteor/vulcan:core';
import { FormattedMessage } from 'meteor/vulcan:i18n';
import Users from 'meteor/vulcan:users';
import { Comments } from "../../lib/collections/comments";
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  newComment: {
    padding: '0 10px',
    border: 'solid 1px rgba(0,0,0,.2)',
    position: 'relative',
    marginBottom: 8,
    "@media print": {
      display: "none"
    }
  },
  newCommentLabel: {
    ...theme.typography.commentStyle,
    ...theme.typography.body2,
    fontWeight: 600,
    marginTop: theme.spacing.unit
  }
});

const CommentsNewWrapper = ({currentUser, postId, post, classes}) => {
  const { LoginPopupLink, CommentsNewForm } = Components;
  return <React.Fragment>
    {!currentUser &&
      <div>
        <LoginPopupLink>
          <FormattedMessage id={!(getSetting('AlignmentForum', false)) ? "comments.please_log_in" : "alignment.comments.please_log_in"}/>
        </LoginPopupLink>
      </div>
    }
    {currentUser && Users.isAllowedToComment(currentUser, post) &&
      <div id="posts-thread-new-comment" className={classes.newComment}>
        <div className={classes.newCommentLabel}><FormattedMessage id="comments.new"/></div>
        <CommentsNewForm
          postId={postId}
          prefilledProps={{af: Comments.defaultToAlignment(currentUser, post)}}
          type="comment"
        />
      </div>
    }
    {currentUser && !Users.isAllowedToComment(currentUser, post) && (
      <div className="i18n-message author_has_banned_you">
        { Users.blockedCommentingReason(currentUser, post)}
        { !(getSetting('AlignmentForum', false)) && <span>
          (Questions? Send an email to <a className="email-link" href="mailto:moderation@lesserwrong.com">moderation@lesserwrong.com</a>)
        </span> }
      </div>
    )}
  </React.Fragment>
};

registerComponent("CommentsNewWrapper", CommentsNewWrapper,
  withUser,
  withStyles(styles, {name: "CommentsNewWrapper"})
);