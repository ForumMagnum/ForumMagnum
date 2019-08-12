import React, { PureComponent } from 'react';
import { Components, registerComponent, withList, withUpdate } from 'meteor/vulcan:core';
import { Posts } from '../../lib/collections/posts';
import { Comments } from '../../lib/collections/comments'
import withUser from '../common/withUser';
import AddBoxIcon from '@material-ui/icons/AddBox';
import withGlobalKeydown from '../common/withGlobalKeydown';

class RecentDiscussionThreadsList extends PureComponent {

  state = { expandAllThreads: false , showShortformFeed: false }

  handleKeyDown = (event) => {
    const F_Key = 70
    if ((event.metaKey || event.ctrlKey) && event.keyCode == F_Key) {
      this.setState({expandAllThreads: true});
    }
  }

  componentDidMount() {
    const { addKeydownListener } = this.props
    addKeydownListener(this.handleKeyDown);
  }

  toggleShortformFeed = () => {
    this.setState(prevState => ({showShortformFeed: !prevState.showShortformFeed}))
  }

  render () {
    const { results, loading, loadMore, networkStatus, updateComment, currentUser, data: { refetch } } = this.props
    const { showShortformFeed, expandAllThreads } = this.state
    const { SingleColumnSection, SectionTitle, SectionButton, ShortformSubmitForm, Loading } = Components
    
    const loadingMore = networkStatus === 2;

    const { LoadMore } = Components

    if (!loading && results && !results.length) {
      return null
    }

    const expandAll = currentUser?.noCollapseCommentsFrontpage || expandAllThreads

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
          {results && <div>
            {results.map((post, i) =>
              <Components.RecentDiscussionThread
                key={post._id}
                post={post}
                postCount={i} 
                refetch={refetch}
                comments={post.recentComments}
                expandAllThreads={expandAll}
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
  withGlobalKeydown,
  [withUpdate, {
    collection: Comments,
    fragmentName: 'CommentsList',
  }],
  withUser
);
