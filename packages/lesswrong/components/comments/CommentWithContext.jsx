import { Components, getRawComponent, registerComponent, withCurrentUser } from 'meteor/vulcan:core';
import React from 'react';
import { FormattedMessage } from 'meteor/vulcan:i18n';
import { Comments } from "meteor/example-forum";
import moment from 'moment';
import { Link, withRouter } from 'react-router';

class CommentWithContext extends getRawComponent('CommentsItem') {

  renderRecentComment() {
    const comment = this.props.comment;
    const htmlBody = {__html: comment.htmlBody};

    return (
      <div className="comments-item-text content-body">
        {htmlBody && <div className="comment-body" dangerouslySetInnerHTML={htmlBody}></div>}
        <div className="comment-context-link"> <a href={"#"+comment._id}>See comment in full context</a> </div>
      </div>
    )
  }

  // LESSWRONG: Changed the comments-item id and removed reply, but nothing else
  render() {
    const comment = this.props.comment;
    const params = this.props.router.params;
    const commentLink = "/posts/"+params._id+"/"+params.slug+"/"+comment._id;

    return (
      <div className="comments-item comments-item-context" id={comment._id+"top"}>
        <div className="comments-item-body">
          <div className="comments-item-meta">
            <Components.UsersName user={comment.user}/>
            <div className="comments-item-vote">
              <Components.Vote collection={Comments} document={this.props.comment} currentUser={this.props.currentUser}/>
            </div>

            <Components.ShowIf check={Comments.options.mutations.edit.check} document={this.props.comment}>
              <div>
                <a className="comment-edit" onClick={this.showEdit}><FormattedMessage id="comments.edit"/></a>
              </div>
            </Components.ShowIf>
            {/* <Components.SubscribeTo document={comment} /> */}
            <div className="comments-item-date"><Link to={commentLink}>{moment(new Date(comment.postedAt)).fromNow()} </Link></div>
          </div>
          {this.state.showEdit ? this.renderEdit() : this.renderRecentComment()}
        </div>
      </div>
    )
  }


}

registerComponent('CommentWithContext', CommentWithContext, withRouter, withCurrentUser);
