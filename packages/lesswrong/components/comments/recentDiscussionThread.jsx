import React, { Component, PureComponent } from 'react';
import {
  Components,
  registerComponent,
  withList,
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
import { unflattenComments } from '../../lib/modules/utils/unflatten';
import withUser from '../common/withUser';
import { withStyles } from '@material-ui/core/styles';

import Users from "meteor/vulcan:users";
import FontIcon from 'material-ui/FontIcon';
import { postHighlightStyles } from '../../themes/stylePiping'

const styles = theme => ({
  postStyle: theme.typography.postStyle,
  postBody: {
    ...postHighlightStyles(theme),
    marginBottom:theme.spacing.unit*2
  },
  postItem: {
    paddingLeft:10,
    paddingBottom:10,
    ...theme.typography.postStyle,
  },
  continueReading: {
    marginTop:theme.spacing.unit*2,
    marginBottom:theme.spacing.unit*2,
  }
})

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

  render() {
    const { post, postCount, results, loading, editMutation, currentUser, classes } = this.props
    const nestedComments = unflattenComments(results);

    // Only show the loading widget if this is the first post in the recent discussion section, so that the users don't see a bunch of loading components while the comments load
    if (loading && postCount === 0) {
      return  <Loading />
    } else if (loading && postCount !== 0) {
      return null
    } else if (results && !results.length && post.commentCount != null) {
      // New posts should render (to display their highlight).
      // Posts with at least one comment should only render if that those comments meet the frontpage filter requirements
      return null
    }

    const highlightClasses = classNames("recent-discussion-thread-highlight", {"no-comments":post.commentCount === null})

    return (
      <div className="recent-discussion-thread-wrapper">
        <div className={classNames(classes.postItem)}>

          <Link to={Posts.getPageUrl(post)}>
            <Components.PostsItemTitle post={post} />
          </Link>

          <div className="recent-discussion-thread-meta" onClick={() => { this.showExcerpt() }}>
            <Components.MetaInfo>
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
                <Link to={ Users.getProfileUrl(post.user) }>{post.user && post.user.displayName}</Link>
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
            </Components.MetaInfo>
          </div>
        </div>

        { this.state.showExcerpt ?
          <div className={highlightClasses}>
            <Components.LinkPostMessage post={post} />
            { post.htmlHighlight ?
              <div>
                <div className={classNames("post-highlight", classes.postBody)} dangerouslySetInnerHTML={{__html: post.htmlHighlight}}/>
                { post.wordCount > 280 && <div className={classes.continueReading}>
                  <Link to={Posts.getPageUrl(post)}>
                    (Continue Reading {` – ${post.wordCount - 280} more words`})
                  </Link>
                </div>}
              </div>
              :
              <div className="post-highlight excerpt" dangerouslySetInnerHTML={{__html: post.excerpt}}/>
            }
          </div>
          : <div className={highlightClasses} onClick={() => { this.showExcerpt() }}>
              <Components.LinkPostMessage post={post} />
              { post.excerpt && (!post.lastVisitedAt || post.commentCount === null) && <div className={classNames(classes.postBody, "post-highlight", "excerpt")}  dangerouslySetInnerHTML={{__html: post.excerpt}}/>}
            </div>
        }
        <div className="recent-discussion-thread-comment-list">
          <div className={"comments-items"}>
            {nestedComments.map(comment =>
              <div key={comment.item._id}>
                <Components.CommentsNode
                  currentUser={currentUser}
                  comment={comment.item}
                  //eslint-disable-next-line react/no-children-prop
                  children={comment.children}
                  key={comment.item._id}
                  editMutation={editMutation}
                  post={post}
                  frontPage
                />
              </div>
            )}
          </div>
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
  withUser,
  withNewEvents,
  connect(mapStateToProps, mapDispatchToProps),
  withStyles(styles, { name: "RecentDiscussionThread" }),
);
