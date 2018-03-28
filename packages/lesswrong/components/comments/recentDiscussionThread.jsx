import React, { Component, PureComponent } from 'react';
import { Components, registerComponent, withList, Loading, withEdit } from 'meteor/vulcan:core';
import { Link } from 'react-router';
import { Posts, Comments } from 'meteor/example-forum';
import classNames from 'classnames';

class RecentDiscussionThread extends PureComponent {

  constructor(props) {
    super(props);
    this.state = {
      showExcerpt: false,
    };
  }

  render() {
    const { post, results, loading, editMutation, currentUser } = this.props

    if (!loading && results && !results.length && post.commentCount != null) {
      return null
    }

    const highlightClasses = classNames("recent-discussion-thread-highlight", {"no-comments":post.commentCount == null})
    return (
      <div className="recent-discussion-thread-wrapper">
        <Link to={Posts.getPageUrl(post)}>
          <span className="recent-discussion-thread-title">{post.title}</span>
          <span className="recent-discussion-thread-author-name">by {post.user.displayName}</span>
        </Link>
        { this.state.showExcerpt ?
          <div className={highlightClasses}>
            { post.htmlHighlight ?
              <div className="post-highlight" dangerouslySetInnerHTML={{__html: post.htmlHighlight}}/>
              :
              <div className="post-highlight excerpt" dangerouslySetInnerHTML={{__html: post.excerpt}}/>
            }
          </div>
          : <div className={highlightClasses} onClick={() => { this.setState({showExcerpt:true})}}>
              { post.excerpt && (!post.lastVisitedAt || post.commentCount === null) && <div className="post-highlight excerpt" dangerouslySetInnerHTML={{__html: post.excerpt}}/>}
            </div>
        }
        <div className="recent-discussion-thread-comment-list">
          {loading || !results ? <Loading /> :
          <div className={"comments-items"}>
            {results.map(comment =>
              <div key={comment._id}>
                <Components.RecentCommentsItem
                  comment={comment}
                  currentUser={currentUser}
                  editMutation={editMutation}/>
              </div>
            )}
          </div>}
        </div>
      </div>
    )
  }
}

const commentsOptions = {
  collection: Comments,
  queryName: 'selectCommentsListQuery',
  fragmentName: 'SelectCommentsList',
  totalResolver: false,
  pollInterval: 0,
  enableCache: true,
  limit: 3,
};

registerComponent('RecentDiscussionThread', RecentDiscussionThread, [withList, commentsOptions]);
