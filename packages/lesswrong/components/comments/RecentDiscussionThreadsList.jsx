import React, { PureComponent } from 'react';
import { Components, registerComponent, withList, withUpdate } from 'meteor/vulcan:core';
import { Posts } from '../../lib/collections/posts';
import { Comments } from '../../lib/collections/comments'
import withUser from '../common/withUser';
import Tooltip from '@material-ui/core/Tooltip';
import Users from 'meteor/vulcan:users';
import { withApollo } from 'react-apollo'
/* global location */

class RecentDiscussionThreadsList extends PureComponent {
  state = { resettingPage: false }

  toggleExpandComments = () => {
    const { updateUser, currentUser } = this.props
    if (currentUser) {
      // TODO: clean up the truncation script, and replace this with something cleaner. 
      // (truncation script means you can only expand, not collapse, comments, which results in some complex UI that needs to reload the page when collapsing)
      if (!(currentUser.noCollapseCommentsFrontpage)) {
        this.setState({resettingPage: true})
      }
      updateUser({
        selector: { _id: currentUser._id},
        data: {
          noCollapseCommentsFrontpage: !(currentUser.noCollapseCommentsFrontpage),
        },
      })
      // same here
      if (!(currentUser.noCollapseCommentsFrontpage)) {
        location.reload()
      }
    }
  }

  render () {
    const { results, loading, loadMore, networkStatus, updateComment, currentUser, data: { refetch } } = this.props
    const { resettingPage } = this.state
    const { SingleColumnSection, SectionTitle, ShortformSubmitForm, Loading, SectionFooterCheckbox } = Components
    if (networkStatus === 4) return <Loading />
    
    const loadingMore = networkStatus === 2;

    const { LoadMore } = Components

    if (!loading && results && !results.length) {
      return null
    }

    const expandCommentsFrontpage = currentUser ? !(currentUser.noCollapseCommentsFrontpage) : false

    return (
      <SingleColumnSection>
        <SectionTitle title="Recent Discussion">
          {/* TODO: Make this work for non-logged in users */}
          {currentUser && <Tooltip title={expandCommentsFrontpage ? <div><div>Click to collapse comments</div><em>(may require page refresh)</em></div> : "Click to expand all comments."}>
            <div>
              <SectionFooterCheckbox 
                disabled={resettingPage}
                onClick={this.toggleExpandComments} 
                value={expandCommentsFrontpage} 
                label={"Expand Comments"} 
                />
            </div>
          </Tooltip>}
        </SectionTitle>
        {currentUser?.shortformFeedId && <ShortformSubmitForm successCallback={refetch} startCollapsed/>}
        <div>
          {results && <div>
            {results.map((post, i) =>
              <Components.RecentDiscussionThread
                expandAll={expandCommentsFrontpage}
                key={post._id}
                post={post}
                postCount={i} 
                refetch={refetch}
                comments={post.recentComments}
                currentUser={currentUser}
                updateComment={updateComment}/>
            )}
          </div>}
          { loadMore && <LoadMore loading={loadingMore || loading} loadMore={loadMore}  /> }
          { (loading || loadingMore) && <Loading />}
        </div>
      </SingleColumnSection>
    )
  }
}

registerComponent('RecentDiscussionThreadsList', RecentDiscussionThreadsList,
  [withList, {
    collection: Posts,
    queryName: 'selectCommentsListQuery',
    fragmentName: 'PostsRecentDiscussion',
    fetchPolicy: 'cache-and-network',
    enableTotal: false,
    pollInterval: 0,
    enableCache: true,
    extraVariables: {
      commentsLimit: 'Int',
      maxAgeHours: 'Int',
      af: 'Boolean',
    },
    ssr: true,
  }],
  [withUpdate, {
    collection: Comments,
    fragmentName: 'CommentsList',
  }],
  [withUpdate, {
    collection: Users,
    fragmentName: 'UsersCurrent',
  }],
  withApollo,
  withUser
);
