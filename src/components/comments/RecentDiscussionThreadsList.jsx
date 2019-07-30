import React, { PureComponent } from 'react';
import { Components, registerComponent, withList, withUpdate } from 'meteor/vulcan:core';
import { Posts } from '../../lib/collections/posts';
import { Comments } from '../../lib/collections/comments'
import withUser from '../common/withUser';
import AddBoxIcon from '@material-ui/icons/AddBox';

class RecentDiscussionThreadsList extends PureComponent {

  state = { showShortformFeed: false }

  toggleShortformFeed = () => {
    this.setState(prevState => ({showShortformFeed: !prevState.showShortformFeed}))
  }

  render () {
    const { results, loading, loadMore, networkStatus, updateComment, currentUser, data: { refetch }, threadView = "recentDiscussionThread" } = this.props
    const { showShortformFeed } = this.state
    const { SingleColumnSection, SectionTitle, SectionButton, ShortformSubmitForm, Loading } = Components
    
    const loadingMore = networkStatus === 2;

    const { LoadMore } = Components

    if (!loading && results && !results.length) {
      return null
    }

    const limit = (currentUser && currentUser.isAdmin) ? 4 : 3

    return (
      <SingleColumnSection>
        <SectionTitle title="Recent Discussion">
          {currentUser && currentUser.isReviewed && <div onClick={this.toggleShortformFeed}>
            <SectionButton>
              <AddBoxIcon />
              New Shortform Post
            </SectionButton>
          </div>}
        </SectionTitle>
        {showShortformFeed && <ShortformSubmitForm successCallback={refetch}/>}
        <div>
          {loading || !results ? <Loading /> :
          <div> 
            {results.map((post, i) =>
              <Components.RecentDiscussionThread
                key={post._id}
                post={post}
                postCount={i}
                terms={{view:threadView, postId:post._id, limit}}
                currentUser={currentUser}
                updateComment={updateComment}/>
            )}
            { loadMore && <LoadMore loading={loadingMore || loading} loadMore={loadMore}  /> }
            { loadingMore && <Loading />}
          </div>}
        </div>
      </SingleColumnSection>
    )
  }
}

const discussionThreadsOptions = {
  collection: Posts,
  queryName: 'selectCommentsListQuery',
  fragmentName: 'PostsList',
  enableTotal: false,
  pollInterval: 0,
  enableCache: true,
};

const withUpdateOptions = {
  collection: Comments,
  fragmentName: 'CommentsList',
};

registerComponent('RecentDiscussionThreadsList', RecentDiscussionThreadsList, [withList, discussionThreadsOptions], [withUpdate, withUpdateOptions], withUser);
