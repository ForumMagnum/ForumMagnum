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

  render() {
    const comment = this.props.comment;
    const showTitle = this.props.showTitle
    if (comment) {

      let level = this.props.level || 1

      return (
        <div
          className={classNames(
            'comments-node',
            'recent-comments-node',
            {
              "comments-node-root" : level === 1,
              "comments-node-even" : level % 2 === 0,
              "comments-node-odd"  : level % 2 != 0,
              "showParent": this.state.showParent,
            }
          )}>
          { comment.parentCommentId && this.state.showParent && (
            <div className="recent-comment-parent">
              <Components.RecentCommentsSingle
                currentUser={this.props.currentUser}
                documentId={comment.parentCommentId}
                level={level + 1}
                expanded={true}
                key={comment.parentCommentId}
              />
            </div>
          )}

          <div className="comments-item recent-comments-item">
            <div className="comments-item-body recent-comments-item-body ">
              <object><div className="comments-item-meta recent-comments-item-meta">
                { comment.parentCommentId ? (
                  <FontIcon
                    onTouchTap={this.toggleShowParent}
                    className={classNames("material-icons","recent-comments-show-parent",{active:this.state.showParent})}
                  >
                    subdirectory_arrow_left
                  </FontIcon>
                ) : level != 1 && <div className="recent-comment-username-spacing">○</div>}
                <Components.UsersName user={comment.user}/>

                <div className="comments-item-vote recent-comments-item-vote ">
                  <Components.Vote collection={Comments} document={comment} currentUser={this.props.currentUser}/>
                </div>
                <div className="comments-item-date">{moment(new Date(comment.postedAt)).fromNow()}</div>
                { comment.post && (
                  <Link to={Posts.getPageUrl(comment.post) + "#" + comment._id}>
                    <div className="comments-item-origin">
                      { showTitle && comment.post && comment.post.title}
                      <FontIcon className="material-icons comments-item-permalink"> link </FontIcon>
                    </div>
                  </Link>
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

registerComponent('RecentCommentsItem', RecentCommentsItem);
