import {
  Components,
  registerComponent,
  withMutation,
  getActions,
} from 'meteor/vulcan:core';
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router';
import { Posts } from "../../lib/collections/posts";
import classNames from 'classnames';

import { bindActionCreators } from 'redux';
import withNewEvents from '../../lib/events/withNewEvents.jsx';
import { connect } from 'react-redux';
import CommentIcon from '@material-ui/icons/ModeComment';
import Paper from '@material-ui/core/Paper';
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
      readStatus: false,
    }
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

    const { post, currentUser, terms, classes } = this.props;
    const { lastVisitedAt } = post
    const lastCommentedAt = Posts.getLastCommentedAt(post)

    let commentCount = Posts.getCommentCount(post)

    let postClass = "posts-item";
    if (this.state.showHighlight) postClass += " show-highlight";

    const renderCommentsButton = () => {
      const read = lastVisitedAt;
      const newComments = lastVisitedAt < lastCommentedAt;
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
                <Components.PostsItemTitle post={post} sticky={isSticky(post, terms)} read={lastVisitedAt || this.state.readStatus}/>
              </Link>
              <div onClick={this.toggleHighlight} className="posts-item-meta">
                <Components.PostsItemMeta post={post} read={lastVisitedAt || this.state.readStatus}/>
                <span className="posts-item-show-highlight-button">
                  { this.state.showHighlight ?
                    <Components.MetaInfo>
                      Hide Highlight
                      <FontIcon className={classNames("material-icons","hide-highlight-button")}>
                        subdirectory_arrow_left
                      </FontIcon>
                    </Components.MetaInfo>
                  :
                  <Components.MetaInfo>
                    Show Highlight
                    <FontIcon className={classNames("material-icons","show-highlight-button")}>
                      subdirectory_arrow_left
                    </FontIcon>
                  </Components.MetaInfo>  }
                </span>
              </div>
            </div>
            <Components.CategoryDisplay
              onClick={this.toggleHighlight}
              post={post} read={lastVisitedAt || this.state.readStatus}/>

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
                highlightDate={lastVisitedAt}
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
  withNewEvents,
  connect(mapStateToProps, mapDispatchToProps),
  withStyles(styles, { name: "PostsItem" })
);
