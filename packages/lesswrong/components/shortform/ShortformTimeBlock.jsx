import React, { Component } from 'react';
import { Components, withList, registerComponent } from 'meteor/vulcan:core';
import { Comments } from '../../lib/collections/comments';
import { withStyles } from '@material-ui/core/styles';
import {queryIsUpdating} from '../common/queryStatusUtils'

const styles = theme => ({
  shortformGroup: {
    marginTop: 12,
  },
  shortformTag: {
    ...theme.typography.body1,
    ...theme.typography.commentStyle,
    color: theme.palette.grey[700],
    marginBottom: 8,
  },
  subtitle: {
    [theme.breakpoints.down('sm')]:{
      marginBottom: theme.spacing.unit*1.5,
    },
    marginBottom: theme.spacing.unit*2,
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
    const { CommentsNode, LoadMore, SectionSubtitle, SubSection, ContentType } = Components
    if (!comments?.length) return null
    return <div>
      <div className={classes.shortformGroup}>
        <SectionSubtitle className={classes.subtitle}>
          <ContentType type="shortform" label="Shortform [Beta]"/>
        </SectionSubtitle>
        <SubSection>
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
        </SubSection>
      </div>
    </div>
  }
}

registerComponent('ShortformTimeBlock', ShortformTimeBlock,
  [withList, {
    collection: Comments,
    queryName: 'timeframeShortformQuery',
    fragmentName: 'ShortformComments',
    fetchPolicy: 'cache-and-network',
    enableTotal: true,
    limit: 5,
    ssr: true,
  }],
  withStyles(styles, { name: "ShortformTimeBlock" })
);
