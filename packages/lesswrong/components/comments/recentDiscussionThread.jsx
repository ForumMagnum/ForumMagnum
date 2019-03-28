import React, { PureComponent } from 'react';
import {
  Components,
  registerComponent,
  withList,
  Loading,
  getActions,
  withMutation
} from 'meteor/vulcan:core';
import { Link } from 'react-router';
import { Posts } from '../../lib/collections/posts';
import { Comments } from '../../lib/collections/comments'
import classNames from 'classnames';
import { bindActionCreators } from 'redux';
import withNewEvents from '../../lib/events/withNewEvents.jsx';
import { connect } from 'react-redux';
import { unflattenComments } from '../../lib/modules/utils/unflatten';
import withUser from '../common/withUser';
import withErrorBoundary from '../common/withErrorBoundary'

import { withStyles } from '@material-ui/core/styles';
import { postExcerptFromHTML } from '../../lib/editor/ellipsize'
import { postHighlightStyles } from '../../themes/stylePiping'

const styles = theme => ({
  root: {
    marginBottom: theme.spacing.unit*4,
  },
  postStyle: theme.typography.postStyle,
  postBody: {
    ...postHighlightStyles(theme),
    marginBottom:theme.spacing.unit*2,
    maxWidth: "100%",
    overflowX: "auto",
    overflowY: "hidden",
  },
  postItem: {
    paddingBottom:10,
    ...theme.typography.postStyle,
  },
  continueReading: {
    marginTop:theme.spacing.unit*2,
    marginBottom:theme.spacing.unit*2,
  },
  unreadDot: {
    fontFamily: theme.typography.fontFamily,
    color: theme.palette.primary.light,
    fontSize: 30,
    lineHeight:0,
    position: "relative",
    top:5.5,
    marginLeft:2,
    marginRight:5
  },
  postHighlight: {
    ...postHighlightStyles(theme),
    marginTop:5,
    maxWidth:600,
    lineHeight:"22px",
    marginBottom:16,
    '& a, & a:hover, & a:focus, & a:active, & a:visited': {
      backgroundColor: "none"
    }
  },
  noComments: {
    borderBottom: "solid 1px rgba(0,0,0,.2)"
  },
  threadMeta: {
    cursor: "pointer",
    
    "&:hover $showHighlight": {
      opacity: 1
    },
  },
  showHighlight: {
    opacity: 0,
  },
})

class RecentDiscussionThread extends PureComponent {

  constructor(props) {
    super(props);
    this.state = {
      showHighlight: false,
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

  showHighlight = () => {
    this.setState({showHighlight:!this.state.showHighlight});
    this.setState({readStatus:true});
    this.handleMarkAsRead()
  }

  render() {
    const { post, postCount, results, loading, editMutation, currentUser, classes } = this.props

    const { ContentItemBody, LinkPostMessage, PostsItemTitle, PostsItemMeta, ShowOrHideHighlightButton, CommentsNode, PostsHighlight } = Components
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

    const highlightClasses = classNames({
      [classes.noComments]: post.commentCount === null
    })

    return (
      <div className={classes.root}>
        <div className={classNames(classes.postItem)}>

          <Link to={Posts.getPageUrl(post)}>
            <PostsItemTitle post={post} />
          </Link>

          <div className={classes.threadMeta} onClick={this.showHighlight}>
            {currentUser && !(post.lastVisitedAt || this.state.readStatus) &&
              <span title="Unread" className={classes.unreadDot}>•</span>
            }
            <PostsItemMeta post={post}/>
            <ShowOrHideHighlightButton
              className={classes.showHighlight}
              open={this.state.showHighlight}/>
          </div>
        </div>
        { this.state.showHighlight ?
          <div className={highlightClasses}>
            <LinkPostMessage post={post} />
            <PostsHighlight post={post} />
          </div>
          : <div className={highlightClasses} onClick={this.showHighlight}>
              <LinkPostMessage post={post} />
              { (!post.lastVisitedAt || post.commentCount === null) &&
                <ContentItemBody
                  className={classes.postHighlight}
                  dangerouslySetInnerHTML={{__html: postExcerptFromHTML(post.contents && post.contents.htmlHighlight)}}/>}
            </div>
        }
        <div className="recent-discussion-thread-comment-list">
          <div className={"comments-items"}>
            {nestedComments.map(comment =>
              <div key={comment.item._id}>
                <CommentsNode
                  startThreadCollapsed={true}
                  nestingLevel={1}
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
  enableTotal: false,
  pollInterval: 0,
  enableCache: true,
  fetchPolicy: 'cache-and-network',
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
  withErrorBoundary
);
