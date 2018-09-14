import {
  Components,
  registerComponent,
  withMutation,
  getActions,
  getSetting,
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
import CommentIcon from '@material-ui/icons/ModeComment';
import Paper from '@material-ui/core/Paper';
import muiThemeable from 'material-ui/styles/muiThemeable';
import Users from "meteor/vulcan:users";
import FontIcon from 'material-ui/FontIcon';
import { withStyles } from '@material-ui/core/styles';
import { postHighlightStyles } from '../../themes/stylePiping'

const styles = theme => ({
  root: {
    ...theme.typography.postStyle
  },
  highlight: {
    maxWidth:570,
    padding:theme.spacing.unit*2,
    ...postHighlightStyles(theme),
  },
  content: {
    paddingLeft:10,
    paddingTop:10,
    width:"calc(100% - 100px)"
  },
  paperExpanded: {
    backgroundColor: 'inherit',
    outline: "solid 1px rgba(0,0,0,.15)",
    borderBottom: "none"
  },
  paperNotExpanded: {
    backgroundColor: 'inherit',
    outline: "none",
    borderBottom: "solid 1px rgba(0,0,0,.15)"
  },
  commentCountIcon: {
    position:"absolute",
    right:"50%",
    top:"50%",
    transform:"translate(50%, -50%)",
    width:"30px",
    height:"30px",
  },
  commentCount: {
    position:"absolute",
    right:"50%",
    top:"50%",
    marginTop:-3,
    transform:"translate(50%, -50%)",
    color:"white",
    fontVariantNumeric:"lining-nums",
    ...theme.typography.commentStyle
  },
  noUnreadComments: {
    color: "rgba(0,0,0,.15)",
  },
  unreadComments: {
    color: theme.palette.secondary.light,
  }
})

const isSticky = (post, terms) => {
  if (post && terms && terms.forum) {
    return (
      post.sticky ||
      (terms.af && post.afSticky) ||
      (terms.meta && post.metaSticky)
    )
  }
}

class PostsItem extends PureComponent {
  constructor(props, context) {
    super(props)
    this.state = {
      categoryHover: false,
      showNewComments: false,
      lastVisitedAt: props.post.lastVisitedAt,
      lastCommentedAt: Posts.getLastCommentedAt(props.post),
      readStatus: false,
    }
  }
  renderActions() {
    return (
      <div className="posts-actions">
        <Link to={{pathname:'/editPost', query:{postId: this.props.post._id, eventForm: this.props.post.isEvent}}}>
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
    // }
  }

  renderEventDetails = () => {
    const post = this.props.post;
    const isEvent = post.isEvent;
    if (isEvent) {
      return <div className="posts-item-event-details">
        {post.startTime && <span> {moment(post.startTime).calendar()} </span>}
        {post.location && <span> {post.location} </span>}
      </div>
    }
  }

  renderHighlightMenu = () => {
    return (
      <div className="posts-item-highlight-footer" >
        <span className="posts-item-hide-highlight" onClick={this.toggleHighlight}>
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

    const { post, inlineCommentCount, currentUser, terms, classes } = this.props;

    let commentCount = Posts.getCommentCount(post)

    let postClass = "posts-item";
    if (this.state.showHighlight) postClass += " show-highlight";
    const baseScore = getSetting('AlignmentForum', false) ? post.afBaseScore : post.baseScore

    const renderCommentsButton = () => {
      const read = this.state.lastVisitedAt;
      const newComments = this.state.lastVisitedAt < this.state.lastCommentedAt;
      const commentsButtonClassnames = classNames(
        "posts-item-comments",
        {
          "selected":this.state.showNewComments,
          "highlight-selected":this.state.showHighlight
        }
      )

      let unreadCommentsClass = (read && newComments && !this.state.readStatus) ? classes.unreadComments : classes.noUnreadComments;

      return (
        <div onClick={this.toggleNewComments} className={commentsButtonClassnames}>
          <CommentIcon className={classNames(classes.commentCountIcon, unreadCommentsClass)}/>
          <div className={classes.commentCount}>
            { commentCount }
          </div>
        </div>
      )
    }

    let paperStyle =
      (this.state.showNewComments || this.state.showHighlight)
      ? classes.paperExpanded
      : classes.paperNotExpanded

    return (
        <Paper
          className={classNames(postClass, paperStyle)}
          elevation={0}
          square={true}
        >
          <div
            className={classNames(classes.root, "posts-item-content", {"selected":this.state.showHighlight})}
          >

            <div className={classes.content}>
              <Link to={this.getPostLink()}>
                <Components.PostsItemTitle post={post} sticky={isSticky(post, terms)}/>
              </Link>
              <div onClick={this.toggleHighlight}>
                <Components.MetaInfo className="posts-item-meta">

                  {Posts.options.mutations.edit.check(this.props.currentUser, post) && this.renderActions()}
                  {post.user && <div className="posts-item-user">
                    <Link to={ Users.getProfileUrl(post.user) }>{post.user.displayName}</Link>
                  </div>}
                  {this.renderPostFeeds()}
                  {post.postedAt && !post.isEvent && <div className="posts-item-date"> {moment(new Date(post.postedAt)).fromNow()} </div>}
                  <div className="posts-item-points">
                    { baseScore || 0 } { baseScore == 1 ? "point" : "points"}
                  </div>
                  {inlineCommentCount && <div className="posts-item-comments"> {commentCount} comments </div>}
                  {post.wordCount && !post.isEvent && <div>{parseInt(post.wordCount/300) || 1 } min read</div>}
                  {this.renderEventDetails()}
                  <div className="posts-item-show-highlight-button">
                    {currentUser && currentUser.isAdmin &&
                      <Components.PostsStats post={post} />
                    }
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
                </Components.MetaInfo>
              </div>
            </div>
            <div className="post-category-display-container" onClick={this.toggleHighlight}>
              <Components.CategoryDisplay post={post} read={this.state.lastVisitedAt || this.state.readStatus}/>
            </div>

            { renderCommentsButton() }

          </div>
          { this.state.showHighlight &&
            <div className={classes.highlight}>
              <Components.PostsHighlight post={post} />
              { this.renderHighlightMenu() }
            </div>
          }

          { this.state.showNewComments &&
            <div className="posts-item-new-comments-section">
              <div className="post-item-new-comments-header">
                <span className="posts-item-hide-comments" onClick={this.toggleNewComments}>
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
                terms={{view:"postCommentsUnread", limit:5, postId: post._id}}
                post={post}
              />
              <div className="post-item-new-comments-footer">
                <span className="posts-item-hide-comments" onClick={this.toggleNewComments}>
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

registerComponent(
  'PostsItem',
  PostsItem,
  withMutation(mutationOptions),
  muiThemeable(),
  withNewEvents,
  connect(mapStateToProps, mapDispatchToProps),
  withStyles(styles, { name: "PostsItem" })
);
