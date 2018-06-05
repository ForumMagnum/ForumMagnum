import React, { Component, PureComponent } from 'react';
import {
  Components,
  registerComponent,
  withList,
  withCurrentUser,
  Loading,
  getActions,
  withMutation
} from 'meteor/vulcan:core';
import { Link } from 'react-router';
import { Posts, Comments } from 'meteor/example-forum';
import classNames from 'classnames';
import moment from 'moment';
import { bindActionCreators } from 'redux';
import withNewEvents from '../../lib/events/withNewEvents.jsx';
import { connect } from 'react-redux';

import Users from "meteor/vulcan:users";
import FontIcon from 'material-ui/FontIcon';
class RecentDiscussionThread extends PureComponent {

  constructor(props) {
    super(props);
    this.state = {
      showExcerpt: false,
      readStatus: false,
    };
  }

  async handleMarkAsRead () {
    // try {
      const {
        // from the parent component, used in withDocument, GraphQL HOC
        // from connect, Redux HOC
        setViewed,
        postsViewed,
        post,
        // from withMutation, GraphQL HOC
        increasePostViewCount,
      } = this.props;
      // a post id has been found & it's has not been seen yet on this client session
      if (post && post._id && postsViewed && !postsViewed.includes(post._id)) {

        // trigger the asynchronous mutation with postId as an argument
        await increasePostViewCount({postId: post._id});

        // once the mutation is done, update the redux store
        setViewed(post._id);
      }

      //LESSWRONG: register page-visit event
      if (this.props.currentUser) {
        const eventProperties = {
          userId: this.props.currentUser._id,
          important: false,
          intercom: true,
        };

        eventProperties.documentId = post._id;
        eventProperties.postTitle = post.title;
        this.props.registerEvent('post-view', eventProperties)
      }
  }

  showExcerpt = () => {
    this.setState({showExcerpt:!this.state.showExcerpt});
    this.setState({readStatus:true});
    this.handleMarkAsRead()
  }

  renderLinkPost = () => {
    const { post } = this.props
    if (post.url) {
      return <p className="recent-discussion-highlight-link-post">
        Linkpost for <Link to={Posts.getLink(post)} target={Posts.getLinkTarget(post)}>{post.url}</Link>
      </p>
    }
  }

  render() {
    const { post, results, loading, editMutation, currentUser } = this.props

    if (!loading && results && !results.length && post.commentCount != null) {
      return null
    }
    const highlightClasses = classNames("recent-discussion-thread-highlight", {"no-comments":post.commentCount == null})
    return (
      <div className="recent-discussion-thread-wrapper">
        <div className="recent-discussion-thread-post">
          <Link to={Posts.getPageUrl(post)}>
            <span className={classNames("recent-discussion-thread-title", {unread: !post.lastVisitedAt})}>
              {post.url && "[Link]"}{post.unlisted && "[Unlisted]"}{post.isEvent && "[Event]"} {post.title}
            </span>
          </Link>
          <div className="recent-discussion-thread-meta" onClick={() => { this.showExcerpt() }}>
            {currentUser && !(post.lastVisitedAt || this.state.readStatus) &&
              <span title="Unread" className="posts-item-unread-dot">•</span>
            }
            {Posts.options.mutations.edit.check(currentUser, post) &&
              <Link className="recent-discussion-edit"
                to={{pathname:'/editPost', query:{postId: post._id, eventForm: post.isEvent}}}>
                Edit
              </Link>
            }
            <span className="recent-discussion-username">
              <Link to={ Users.getProfileUrl(post.user) }>{post.user.displayName}</Link>
            </span>
            {post.postedAt && !post.isEvent &&
              <span className="recent-discussion-thread-date">
                {moment(new Date(post.postedAt)).fromNow()}
              </span>
            }
            <span className="posts-item-points">
              { post.baseScore } { post.baseScore == 1 ? "point" : "points"}
            </span>
            {post.wordCount && !post.isEvent &&
              <span className="recent-discussion-thread-readtime">
                {parseInt(post.wordCount/300) || 1 } min read
              </span>
            }
            <span className="recent-discussion-show-highlight">

              { this.state.showExcerpt ?
                <span>
                  Hide Highlight
                  <FontIcon className={classNames("material-icons","hide-highlight-button")}>
                    subdirectory_arrow_left
                  </FontIcon>
                </span>
              :
              <span>
                Show Highlight
                <FontIcon className={classNames("material-icons","show-highlight-button")}>
                  subdirectory_arrow_left
                </FontIcon>
              </span>  }
            </span>
          </div>
        </div>

        { this.state.showExcerpt ?
          <div className={highlightClasses}>
            { this.renderLinkPost() }
            { post.htmlHighlight ?
              <div>
                <div className="post-highlight" dangerouslySetInnerHTML={{__html: post.htmlHighlight}}/>
                { post.wordCount > 280 && <Link to={Posts.getPageUrl(post)}>
                  (Continue Reading {` – ${post.wordCount - 280} more words`})
                </Link>}
              </div>
              :
              <div className="post-highlight excerpt" dangerouslySetInnerHTML={{__html: post.excerpt}}/>
            }
          </div>
          : <div className={highlightClasses} onClick={() => { this.showExcerpt() }}>
              { this.renderLinkPost() }
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

const mutationOptions = {
  name: 'increasePostViewCount',
  args: {postId: 'String'},
};

const mapStateToProps = state => ({ postsViewed: state.postsViewed });
const mapDispatchToProps = dispatch => bindActionCreators(getActions().postsViewed, dispatch);

registerComponent(
  'RecentDiscussionThread',
  RecentDiscussionThread,
  [withList, commentsOptions],
  withMutation(mutationOptions),
  withCurrentUser,
  withNewEvents,
  connect(mapStateToProps, mapDispatchToProps),
);
