import { Components, getRawComponent, registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import { Posts } from '../../lib/collections/posts';
import { Link } from 'react-router';
import FontIcon from 'material-ui/FontIcon';
import classNames from 'classnames';
import withErrorBoundary from '../common/withErrorBoundary'

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
    const plaintext = comment.body;

    const expanded = !(!this.state.expanded && plaintext && plaintext.length > 300) || this.props.expanded
    if (!expanded && plaintext) {
      // Add ellipsis to last element of commentExcerpt
      let commentExcerpt = plaintext.substring(0,300).split("\n\n");
      const lastElement = commentExcerpt.slice(-1)[0];
      let paragraphCounter = 0;
      commentExcerpt = commentExcerpt.slice(0, commentExcerpt.length - 1).map((text) => <p key={ comment._id + paragraphCounter++}>{text}</p>);
      return <div className="comments-item-text content-body">
        {commentExcerpt}
        <p>{lastElement + "..."}<a className="read-more" onClick={() => this.setState({expanded: true})}>(read more)</a> </p>
      </div>
    } else {
      return (
        <div className="comments-item-text content-body" >
          <Components.CommentBody comment={comment}/>
        </div>
      )
    }
  }

  render() {
    const { comment, showTitle, level=1 } = this.props;

    if (comment && comment.post) {
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
              <div className="comments-item-meta recent-comments-item-meta">
                { comment.parentCommentId ? (
                  <FontIcon
                    onClick={this.toggleShowParent}
                    className={classNames("material-icons","recent-comments-show-parent",{active:this.state.showParent})}
                  >
                    subdirectory_arrow_left
                  </FontIcon>
                ) : level != 1 && <div className="recent-comment-username-spacing">○</div>}
                <Components.UsersName user={comment.user}/>
                { comment.post && (
                  <Link to={Posts.getPageUrl(comment.post) + "#" + comment._id}>
                    <div className="comments-item-origin">
                      <div className="comments-item-date">
                        <Components.FromNowDate date={comment.postedAt}/>
                        <FontIcon className="material-icons comments-item-permalink"> link </FontIcon>
                      </div>
                      { showTitle && comment.post && comment.post.title}
                    </div>
                  </Link>
                )}
                <Components.CommentsVote comment={comment} currentUser={this.props.currentUser} />
                { level === 1 && this.renderMenu() }
              </div>
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

registerComponent('RecentCommentsItem', RecentCommentsItem, withErrorBoundary);
