import React, { Component } from 'react';
import { Components, withList, registerComponent } from 'meteor/vulcan:core';
import { Comments } from '../../lib/collections/comments';
import { withStyles } from '@material-ui/core/styles';
import {queryIsUpdating} from '../common/queryStatusUtils'

const styles = theme => ({
  shortformGroup: {
    marginTop: 20,
  },
  shortformTag: {
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
    color: theme.palette.grey[700],
    marginBottom: 8,
  },
})

class ShortformTimeBlock extends Component {
  componentDidMount () {
    const {networkStatus, results: comments} = this.props
    this.checkEmpty(networkStatus, comments)
  }

  componentDidUpdate (prevProps) {
    const {networkStatus: prevNetworkStatus} = prevProps
    const {networkStatus, results: comments} = this.props
    if (prevNetworkStatus !== networkStatus) {
      this.checkEmpty(networkStatus, comments)
    }
  }

  checkEmpty (networkStatus, comments) {
    const { reportEmpty } = this.props
    // https://github.com/apollographql/apollo-client/blob/master/packages/apollo-client/src/core/networkStatus.ts
    // 1-4 indicate query is in flight
    // There's a double negative here. We want to know if we did *not* find
    // shortform, because if there's no content for a day, we don't render.
    if (!queryIsUpdating(networkStatus) && !comments?.length && reportEmpty) {
      reportEmpty()
    }
  }

  render () {
    const { totalCount, loadMore, results: comments, classes } = this.props
    const { CommentsNode, LoadMore } = Components
    if (!comments?.length) return null
    return <div>
      <div className={classes.shortformGroup}>
        <div className={classes.shortformTag}>
          Shortform [Beta]
        </div>
        {comments?.map((comment, i) =>
          <CommentsNode
            comment={comment} post={comment.post}
            key={comment._id}
            forceSingleLine loadChildrenSeparately
          />)}
        {comments?.length < totalCount &&
        <LoadMore
          loadMore={loadMore}
          count={comments.length}
          totalCount={totalCount}
        />
        }
      </div>
    </div>
  }
}

registerComponent('ShortformTimeBlock', ShortformTimeBlock,
  [withList, {
    collection: Comments,
    queryName: 'dailyShortformQuery',
    fragmentName: 'ShortformComments',
    enableTotal: true,
    enableCache: true,
    limit: 3,
    ssr: true,
  }],
  withStyles(styles, { name: "ShortformTimeBlock" })
);
