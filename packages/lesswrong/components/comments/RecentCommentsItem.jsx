import { Components, getRawComponent, registerComponent, withDocument } from 'meteor/vulcan:core';
import React from 'react';
import moment from 'moment';
import { Comments, Posts } from "meteor/example-forum";
import { Link } from 'react-router';

import FontIcon from 'material-ui/FontIcon';
import classNames from 'classnames';

class RecentCommentsItem extends getRawComponent('CommentsItem') {
  constructor(props) {
    super(props);
    this.state = {
      showReply: false,
      showEdit: false,
      expanded: false,
      showParent: false
    };
  }

  toggleShowParent = () => {
    this.setState({showParent:!this.state.showParent})
  }

  renderRecentComment() {
    const comment = this.props.comment || this.props.document
    const htmlBody = {__html: comment.htmlBody};
    const plaintext = comment.body;

    const expanded = !(!this.state.expanded && plaintext && plaintext.length > 300) || this.props.expanded
    if (!expanded && plaintext) {
      // Add ellipsis to last element of commentExcerpt
      let commentExcerpt = plaintext.substring(0,300).split("\n\n");
      const lastElement = commentExcerpt.slice(-1)[0];
      let paragraphCounter = 0;
      commentExcerpt = commentExcerpt.slice(0, commentExcerpt.length - 1).map((text) => <p key={ comment._id + paragraphCounter++}>{text}</p>);
      return <div className="recent-comments-item-text comments-item-text content-body">
        {commentExcerpt}
        <p>{lastElement + "..."}<a className="read-more" onTouchTap={() => this.setState({expanded: true})}>(read more)</a> </p>
      </div>
    } else {
      return (
        <div className="recent-comments-item-text comments-item-text content-body" >
          {htmlBody && <div className="recent-comment-body comment-body" dangerouslySetInnerHTML={htmlBody}></div>}
        </div>
      )
    }
  }

  getParentHeight = (parentComment) => {
    const rows = parentComment.body.length/118
    return -80 - rows*20
  }

  render() {
    const comment = this.props.comment || this.props.document;
    if (comment) {
      if (comment.parentComment) {
        const parentHtmlBody = {__html: comment.parentComment.htmlBody};
      }

      let level = this.props.level || 1

      const commentRoot = level === 1;

      return (
        <div
          className={classNames(
            'comments-node',
            'recent-comments-node',
            'comments-' + level.toString(),
            {
              "comments-node-root" : commentRoot,
              "comments-node-even" : level % 2 === 0,
              "comments-node-odd"  : level % 2 != 0,
              "showParent": this.state.showParent,
            }
          )}>
          { comment.parentComment && this.state.showParent && (
            <div
              className="recent-comment-parent"
              style={{top:this.getParentHeight(comment.parentComment) + "px"}}
            >
              <Components.RecentCommentsItem
                currentUser={this.props.currentUser}
                documentId={comment.parentComment._id}
                level={level + 1}
                expanded={true}
                key={comment.parentComment._id}
              />
            </div>
          )}

          <div className="comments-item recent-comments-item">
            <div className="comments-item-body recent-comments-item-body ">
              <object><div className="comments-item-meta recent-comments-item-meta">
                { comment.parentComment && (
                  <FontIcon
                    onTouchTap={this.toggleShowParent}
                    className={classNames("material-icons","recent-comments-show-parent",{active:this.state.showParent})}
                  >
                    subdirectory_arrow_left
                  </FontIcon>
                )}
                <Components.UsersName user={comment.user}/>

                <div className="comments-item-vote recent-comments-item-vote ">
                  <Components.Vote collection={Comments} document={comment} currentUser={this.props.currentUser}/>
                </div>
                <div className="comments-item-date">{moment(new Date(comment.postedAt)).fromNow()}</div>
                { comment.post && (
                  <Link to={Posts.getPageUrl(comment.post) + "/" + comment._id}> <div className="comments-item-origin">
                    on <span className="comments-item-origin-post-title">{comment.post.title}</span>
                  </div> </Link>
                )}
                { level === 1 && this.renderMenu() }
              </div></object>
              {this.state.showEdit ? this.renderEdit() : this.renderRecentComment()}
            </div>
          </div>
          {this.state.showReply ? this.renderReply() : null}
        </div>
      )
    } else {
      return <div className="comments-node recent-comments-node loading">
        <Components.Loading />
      </div>
    }
  }
}

const documentOptions = {
  collection: Comments,
  queryName: 'postsSingleQuery',
  fragmentName: 'SelectCommentsList',
};

registerComponent('RecentCommentsItem', RecentCommentsItem, [withDocument, documentOptions]);
