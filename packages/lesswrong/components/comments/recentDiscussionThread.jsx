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

    if (!loading && results && !results.length) {
      return null
    }
    return (
      <div className="recent-discussion-thread-wrapper">
        <Link to={Posts.getPageUrl(post)}>
          <span className="recent-discussion-thread-title">{post.title}</span>
          <span className="recent-discussion-thread-author-name">by {post.user.displayName}</span>
        </Link>
        { this.state.showExcerpt ?
          <div className="recent-discussion-thread-highlight">
            { post.excerpt && post.excerpt }...
            <Link className="recent-discussion-read-more" to={Posts.getPageUrl(post)}>
              ({parseInt(post.wordCount/300) || 1} min read)
            </Link>
          </div>
          : <div className="recent-discussion-thread-highlight" onClick={() => { this.setState({showExcerpt:true})}}>
              { post.excerpt && post.excerpt.slice(0, !post.lastVisitedAt ? 300 : 0)}
              { !post.lastVisitedAt && "..."}
              <span className={classNames("recent-discussion-read-more", {read:post.lastVisitedAt})}>
                {!post.lastVisitedAt ? "(Read more)" : "(Show Except)"}
              </span>
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
