import React, { PureComponent } from 'react';
import { Components, registerComponent, withList, withUpdate } from 'meteor/vulcan:core';
import { Posts } from '../../lib/collections/posts';
import { Comments } from '../../lib/collections/comments'
import withUser from '../common/withUser';
import AddBoxIcon from '@material-ui/icons/AddBox';
import Tooltip from '@material-ui/core/Tooltip';
import Users from 'meteor/vulcan:users';
import { withApollo } from 'react-apollo'

class RecentDiscussionThreadsList extends PureComponent {

  toggleExpandComments = () => {
    const { updateUser, currentUser } = this.props
    if (currentUser) {
      updateUser({
        selector: { _id: currentUser._id},
        data: {
          noCollapseCommentsFrontpage: !(currentUser.noCollapseCommentsFrontpage),
        },
      })
    }
  }

  render () {
    const { results, loading, loadMore, networkStatus, updateComment, currentUser, data: { refetch }, threadView = "recentDiscussionThread" } = this.props
    const { SingleColumnSection, SectionTitle, ShortformSubmitForm, Loading, SectionFooterCheckbox } = Components
    if (networkStatus === 4) return <Loading />
    
    const loadingMore = networkStatus === 2;

    const { LoadMore } = Components

    if (!loading && results && !results.length) {
      return null
    }

    const expandCommentsFrontpage = !(currentUser && currentUser.noCollapseCommentsFrontpage)

    return (
      <SingleColumnSection>
        <SectionTitle title="Recent Discussion">
          <Tooltip title={expandCommentsFrontpage ? <div><div>Click to collapse comments</div><em>(may require page refresh)</em></div> : "Click to expand all comments."}>
            <div>
              <SectionFooterCheckbox 
                onClick={this.toggleExpandComments} 
                value={expandCommentsFrontpage} 
                label={"Expand Comments"} 
                />
            </div>
          </Tooltip>
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
                terms={{view:threadView, postId:post._id, limit:4}}
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

registerComponent(
  'RecentDiscussionThreadsList', 
  RecentDiscussionThreadsList, 
  [withList, {
    collection: Posts,
    queryName: 'selectCommentsListQuery',
    fragmentName: 'PostsList',
    fetchPolicy: 'cache-and-network',
    enableTotal: false,
    pollInterval: 0,
    enableCache: true,
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
  withUser);
