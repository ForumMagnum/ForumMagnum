import React, { PureComponent } from 'react';
import {
  Components,
  registerComponent,
  withList,
  Loading,
} from 'meteor/vulcan:core';

import { Link } from '../../lib/reactRouterWrapper.js';
import { Posts } from '../../lib/collections/posts';
import { Comments } from '../../lib/collections/comments'
import { unflattenComments } from '../../lib/modules/utils/unflatten';
import withUser from '../common/withUser';
import withErrorBoundary from '../common/withErrorBoundary'
import withRecordPostView from '../common/withRecordPostView';

import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  root: {
    marginTop: theme.spacing.unit*2,
    marginBottom: theme.spacing.unit*4,
    position: "relative",
    minHeight: 50,
  },
  postItem: {
    paddingBottom:10,
    ...theme.typography.postStyle,
  },
  continueReading: {
    marginTop:theme.spacing.unit*2,
    marginBottom:theme.spacing.unit*2,
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
    ...theme.typography.body1,
    ...theme.typography.postStyle,
  }
})

class ShortformThread extends PureComponent {
  state = { showHighlight: false, readStatus: false, markedAsVisitedAt: null }
  
  markAsRead = async () => {
    this.setState({readStatus:true, markedAsVisitedAt: new Date()});
    this.props.recordPostView({...this.props, document:this.props.post})
  }

  render() {
    const { post, postCount, results, loading, editMutation, currentUser, classes } = this.props
    const { readStatus, markedAsVisitedAt } = this.state

    const { CommentsNode } = Components

    const lastCommentId = results && results[0]?._id

    const nestedComments = unflattenComments(results)

    const topLevelComments = _.uniq(_.map(results, c => c.topLevelComment), c => c?._id)

    const topLevelCommentsNested = _.map(topLevelComments, topComment => {
      if (!topComment) return
      const children = _.filter(nestedComments, c => c?.item?.topLevelCommentId === topComment._id)
      return { item: topComment, children: children}
    })

    console.log(post.title, "tnested", topLevelCommentsNested)

    // console.log(nestedComments)
    const lastVisitedAt = markedAsVisitedAt || post.lastVisitedAt

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

    return (
      <div className={classes.root}>
        <div className={classes.postItem}>
          <Link className={classes.title} to={Posts.getPageUrl(post)}>
            {post.title} 
          </Link>
        </div>
        <div className={classes.content}>
          <div className={classes.commentsList}>
            <div className={"comments-items"}>
              {topLevelCommentsNested.map(comment =>
                <div key={comment.item._id}>
                  
                  <CommentsNode
                    startThreadTruncated={true}
                    nestingLevel={1}
                    lastCommentId={lastCommentId}
                    currentUser={currentUser}
                    comment={comment.item}
                    markAsRead={this.markAsRead}
                    highlightDate={lastVisitedAt}
                    //eslint-disable-next-line react/no-children-prop
                    children={comment.children}
                    key={comment.item._id}
                    editMutation={editMutation}
                    post={post}
                    
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }
}

const commentsOptions = {
  collection: Comments,
  queryName: 'selectCommentsListQuery',
  fragmentName: 'RecentDiscussionComments',
  enableTotal: false,
  pollInterval: 0,
  enableCache: true,
  fetchPolicy: 'cache-and-network',
  limit: 12,
};

registerComponent(
  'ShortformThread',
  ShortformThread,
  [withList, commentsOptions],
  withUser,
  withStyles(styles, { name: "ShortformThread" }),
  withRecordPostView,
  withErrorBoundary
);
