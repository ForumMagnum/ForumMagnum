import React, { PureComponent } from 'react';
import {
  Components,
  registerComponent,
} from 'meteor/vulcan:core';

import { Link } from '../../lib/reactRouterWrapper.js';
import { Posts } from '../../lib/collections/posts';
import classNames from 'classnames';
import { unflattenComments } from '../../lib/modules/utils/unflatten';
import withUser from '../common/withUser';
import withErrorBoundary from '../common/withErrorBoundary'
import withRecordPostView from '../common/withRecordPostView';

import { withStyles } from '@material-ui/core/styles';
import { postExcerptFromHTML } from '../../lib/editor/ellipsize'
import { postHighlightStyles } from '../../themes/stylePiping'

const styles = theme => ({
  root: {
    marginTop: theme.spacing.unit*2,
    marginBottom: theme.spacing.unit*4,
    position: "relative",
    minHeight: 50,
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
    // position: "absolute",
    // right: "100%",
    paddingBottom:10,
    ...theme.typography.postStyle,
    // width: 300,
    // marginTop: -2,
    // textAlign: "right",
    // marginRight: -theme.spacing.unit
  },
  continueReading: {
    marginTop:theme.spacing.unit*2,
    marginBottom:theme.spacing.unit*2,
  },
  unreadPost: {
    borderLeft: `solid 5px ${theme.palette.primary.light}`,
    paddingLeft: theme.spacing.unit*1.5,
    cursor: "pointer",
    '&:hover': {
      borderLeft: `solid 5px ${theme.palette.primary.main}`,
    }
  },
  postHighlight: {
    ...postHighlightStyles(theme),
    marginTop:5,
    maxWidth:600,
    marginBottom:16,
    maxHeight: 1000,
    overflow: "hidden",
    '& a, & a:hover, & a:focus, & a:active, & a:visited': {
      backgroundColor: "none"
    }
  },
  noComments: {
    // borderBottom: "solid 1px rgba(0,0,0,.2)"
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
  content :{
    [theme.breakpoints.up('lg')]: {
      marginLeft: theme.spacing.unit*3,
    }
  },
  commentsList: {
    [theme.breakpoints.down('md')]: {
      marginLeft: 0,
      marginRight: 0
    }
  },
  title: {
    ...theme.typography.body2,
    ...theme.typography.postStyle,
  }
})

class RecentDiscussionThread extends PureComponent {
  state = { showHighlight: false, readStatus: false, markedAsVisitedAt: null, expandAllThreads: false }

  showHighlight = () => {
    this.setState(prevState => ({showHighlight:!prevState.showHighlight}));
    this.markAsRead()
  }

  markAsRead = async () => {
    this.setState({readStatus:true, markedAsVisitedAt: new Date(), expandAllThreads: true});
    this.props.recordPostView({post:this.props.post})
  }

  render() {
    const { post, comments, updateComment, currentUser, classes, isRead, refetch } = this.props
    const { readStatus, showHighlight, markedAsVisitedAt } = this.state
    const { ContentItemBody, PostsItemMeta, ShowOrHideHighlightButton, CommentsNode, PostsHighlight, PostsTitle } = Components

    const lastCommentId = comments && comments[0]?._id
    const nestedComments = unflattenComments(comments);

    const lastVisitedAt = markedAsVisitedAt || post.lastVisitedAt

    if (comments && !comments.length && post.commentCount != null) {
      // New posts should render (to display their highlight).
      // Posts with at least one comment should only render if that those comments meet the frontpage filter requirements
      return null
    }

    const highlightClasses = classNames({
      [classes.noComments]: post.commentCount === null
    })

    return (
      <div className={classes.root}>
        <div className={(currentUser && !(isRead || readStatus)) ? classes.unreadPost : null}>
          <div className={classes.postItem}>
            <Link className={classes.title} to={Posts.getPageUrl(post)}>
              <PostsTitle wrap post={post} />
            </Link>

            <div className={classes.threadMeta} onClick={this.showHighlight}>
              <PostsItemMeta post={post}/>
              <ShowOrHideHighlightButton
                className={classes.showHighlight}
                open={showHighlight}/>
            </div>
          </div>
          { showHighlight ?
            <div className={highlightClasses}>
              <PostsHighlight post={post} />
            </div>
            : <div className={highlightClasses} onClick={this.showHighlight}>
                { (!isRead || post.commentCount === null) &&
                  <ContentItemBody
                    className={classes.postHighlight}
                    dangerouslySetInnerHTML={{__html: postExcerptFromHTML(post.contents && post.contents.htmlHighlight)}}/>}
              </div>
          }
        </div>
        <div className={classes.content}>
          <div className={classes.commentsList}>
            {nestedComments.map(comment =>
              <div key={comment.item._id}>
                <CommentsNode
                  startThreadTruncated={true}
                  expandAllThreads={this.props.expandAllThreads || this.state.expandAllThreads}
                  scrollOnExpand
                  nestingLevel={1}
                  lastCommentId={lastCommentId}
                  currentUser={currentUser}
                  comment={comment.item}
                  markAsRead={this.markAsRead}
                  highlightDate={lastVisitedAt}
                  //eslint-disable-next-line react/no-children-prop
                  children={comment.children}
                  key={comment.item._id}
                  updateComment={updateComment}
                  post={post}
                  refetch={refetch}
                  condensed
                />
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }
}

registerComponent(
  'RecentDiscussionThread',
  RecentDiscussionThread,
  withUser,
  withStyles(styles, { name: "RecentDiscussionThread" }),
  withRecordPostView,
  withErrorBoundary
);
