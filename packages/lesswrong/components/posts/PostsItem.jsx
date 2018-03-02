import {
  Components,
  replaceComponent,
  withCurrentUser,
  withMutation,
  getActions,
} from 'meteor/vulcan:core';
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router';
import { Posts } from "meteor/example-forum";
import moment from 'moment';
import classNames from 'classnames';

import { bindActionCreators } from 'redux';
import withNewEvents from '../../lib/events/withNewEvents.jsx';
import { connect } from 'react-redux';
import CommentIcon from 'material-ui/svg-icons/editor/mode-comment';
import IconButton from 'material-ui/IconButton';
import Badge from 'material-ui/Badge';
import Paper from 'material-ui/Paper';
import muiThemeable from 'material-ui/styles/muiThemeable';

import FontIcon from 'material-ui/FontIcon';

const paperStyle = {
  backgroundColor: 'inherit',
}


class PostsItem extends PureComponent {
  constructor(props, context) {
    super(props)
    this.state = {
      categoryHover: false,
      showNewComments: false,
      lastVisitedAt: props.post.lastVisitedAt,
      lastCommentedAt: props.post.lastCommentedAt,
      readStatus: false,
    }
  }
  renderActions() {
    return (
      <div className="posts-actions">
        <Link to={{pathname:'/editPost', query:{postId: this.props.post._id}}}>
          Edit
        </Link>
      </div>
    )
  }

  renderPostFeeds() {
    const feed = this.props.post.feed
    return (feed && feed.user ? <span className="post-feed-nickname"> {feed.nickname} </span> : null);
  }

  toggleNewComments = () => {
    this.handleMarkAsRead()
    this.setState({readStatus: true});
    this.setState({showNewComments: !this.state.showNewComments});
    this.setState({showHighlight: false});
  }
  toggleHighlight = () => {
    this.handleMarkAsRead()
    this.setState({readStatus: true});
    this.setState({showHighlight: !this.state.showHighlight});
    this.setState({showNewComments: false});
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

  renderHighlightMenu = () => {
    return (
      <div className="posts-item-highlight-footer" >
        <span className="posts-item-hide-highlight" onTouchTap={this.toggleHighlight}>
          <FontIcon className={classNames("material-icons")}>
            subdirectory_arrow_left
          </FontIcon>
          Collapse
        </span>
        <Link to={this.getPostLink()}>
          <span className="posts-item-view-full-post">
            Continue to Full Post {this.props.post.wordCount && <span> ({this.props.post.wordCount} words)</span>}
          </span>
        </Link>
      </div>
    )
  }

  getPostLink = () => {
   const {post, chapter} = this.props
   return chapter ? ("/s/" + chapter.sequenceId + "/p/" + post._id) : Posts.getPageUrl(post)
 }

  render() {

    const {post, inlineCommentCount, currentUser} = this.props;

    const commentCount = post.commentCount ? post.commentCount : 0

    let postClass = "posts-item";
    if (post.sticky) postClass += " posts-sticky";
    if (this.state.showHighlight) postClass += " show-highlight";

    const renderCommentsButton = () => {
      const read = this.state.lastVisitedAt;
      const newComments = this.state.lastVisitedAt < this.state.lastCommentedAt;

      const commentCountIconStyle = {
        width:"30px",
        height:"30px",
        color: (read && newComments && !this.state.readStatus) ? this.props.muiTheme.palette.accent1Color : "rgba(0,0,0,.15)",
      }

      return (
        <div>
          <CommentIcon className="posts-item-comment-icon" style={commentCountIconStyle}/>
          <div className="posts-item-comment-count">
            {post.commentCount || 0}
          </div>
        </div>
      )
    }

    if (this.state.showNewComments || this.state.showHighlight) {
      paperStyle.outline = "solid 1px rgba(0,0,0,.15)"
      paperStyle.borderBottom = "none"
    } else {
      paperStyle.outline = "none"
      paperStyle.borderBottom = "solid 1px rgba(0,0,0,.15)"
    }
    return (
        <Paper
          className={postClass}
          style={paperStyle}
          zDepth={0}
        >
          <div
            className={classNames("posts-item-content", {"selected":this.state.showHighlight})}
          >

            <div className="posts-item-body">
              <Link to={this.getPostLink()} className="posts-item-title-link">
                <h3 className="posts-item-title">
                  {post.url && "[Link]"}{post.unlisted && "[Unlisted]"} {post.title}
                </h3>
              </Link>


              <object>
                <div className="posts-item-meta" onTouchTap={this.toggleHighlight}>
                  {Posts.options.mutations.edit.check(this.props.currentUser, post) ? this.renderActions() : null}
                  {post.user ? <div className="posts-item-user"> {post.user.displayName} </div> : null}
                  {this.renderPostFeeds()}
                  {post.postedAt ? <div className="posts-item-date"> {moment(new Date(post.postedAt)).fromNow()} </div> : null}
                  <div className="posts-item-vote"> <Components.Vote collection={Posts} document={post} currentUser={currentUser}/> </div>
                  {inlineCommentCount && <div className="posts-item-comments"> {commentCount} comments </div>}
                  {post.wordCount && <div>{parseInt(post.wordCount/300) || 1 } min read</div>}
                  {currentUser && this.props.currentUser.isAdmin ? <div className="posts-item-admin"><Components.PostsStats post={post} /></div> : null}
                  <div className="posts-item-show-highlight-button">
                    { this.state.showHighlight ?
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

                  </div>
                </div>
              </object>
              <div className="post-category-display-container" onTouchTap={this.toggleHighlight}>
                <Components.CategoryDisplay post={post} read={this.state.lastVisitedAt || this.state.readStatus}/>
              </div>
            </div>
          </div>

          <div
            onTouchTap={this.toggleNewComments}
            className={classNames(
              "posts-item-comments",
              {
                "selected":this.state.showNewComments,
                "highlight-selected":this.state.showHighlight
              }
            )}
          >
            { renderCommentsButton() }
          </div>
          { this.state.showHighlight &&
            <div className="posts-item-highlight">
              { post.url && <p className="posts-page-content-body-link-post">
                This is a linkpost for <Link to={Posts.getLink(post)} target={Posts.getLinkTarget(post)}>{post.url}</Link>
              </p>}
              <div className="posts-item-highlight-content" >
                <Components.PostsBody documentId={post._id}/>
              </div>
              { this.renderHighlightMenu() }
            </div>
          }

          { this.state.showNewComments &&
            <div className="posts-item-new-comments-section">
              <div className="post-item-new-comments-header">
                <span className="posts-item-hide-comments" onTouchTap={this.toggleNewComments}>
                  <FontIcon className={classNames("material-icons")}>
                    subdirectory_arrow_left
                  </FontIcon>
                  Collapse
                </span>
                <Link className="posts-item-view-all-comments" to={this.getPostLink() + "#comments"}>
                  View All Comments
                </Link>
              </div>
              <div className="posts-item-recent-comments-title">Recent Comments</div>
              <Components.PostsItemNewCommentsWrapper
                currentUser={currentUser}
                highlightDate={this.state.lastVisitedAt}
                terms={{view:"postCommentsUnread", limit:12, postId:this.props.post._id}}
                post={post}
              />
              { post.commentCount > 10 && <div>
                <div className="posts-item-top-comments-title">Top Comments</div>
                <Components.RecentComments
                  terms={{view: 'topRecentComments', limit: 3, postId:post._id}}
                  fontSize="small"
                  loadMore={false}
                />
              </div>}
              <div className="post-item-new-comments-footer">
                <span className="posts-item-hide-comments" onTouchTap={this.toggleNewComments}>
                  <FontIcon className={classNames("material-icons")}>
                    subdirectory_arrow_left
                  </FontIcon>
                  Collapse
                </span>
                <Link className="posts-item-view-all-comments" to={this.getPostLink() + "#comments"}>
                  View All Comments
                </Link>
              </div>
            </div>
          }
        </Paper>
    )
  }
}

PostsItem.propTypes = {
  currentUser: PropTypes.object,
  post: PropTypes.object.isRequired,
  terms: PropTypes.object,
  postsViewed: PropTypes.array,
  setViewed: PropTypes.func,
  increasePostViewCount: PropTypes.func,
};

const mutationOptions = {
  name: 'increasePostViewCount',
  args: {postId: 'String'},
};

const mapStateToProps = state => ({ postsViewed: state.postsViewed });
const mapDispatchToProps = dispatch => bindActionCreators(getActions().postsViewed, dispatch);

replaceComponent(
  'PostsItem',
  PostsItem,
  withCurrentUser,
  withMutation(mutationOptions),
  muiThemeable(),
  withNewEvents,
  connect(mapStateToProps, mapDispatchToProps),
);
