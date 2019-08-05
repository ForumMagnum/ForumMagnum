import React, { PureComponent } from 'react';
import { Components, registerComponent, withList, withUpdate } from 'meteor/vulcan:core';
import { Posts } from '../../lib/collections/posts';
import { Comments } from '../../lib/collections/comments'
import withUser from '../common/withUser';
import AddBoxIcon from '@material-ui/icons/AddBox';
import Tooltip from '@material-ui/core/Tooltip';
import Users from 'meteor/vulcan:users';

class RecentDiscussionThreadsList extends PureComponent {

  state = { showSettings: false, showShortformFeed: false }

  toggleShortformFeed = () => {
    this.setState(prevState => ({showShortformFeed: !prevState.showShortformFeed}))
  }

  toggleShowSettings = () => {
    this.setState(prevState => ({showSettings: !prevState.showSettings}))
  }

  toggleExpandComments = () => {
    const { updateUser, currentUser, data: { refetch } } = this.props
    if (currentUser) {
      updateUser({
        selector: { _id: currentUser._id},
        data: {
          noCollapseCommentsFrontpage: !(currentUser.noCollapseCommentsFrontpage),
        },
      })
    }
    if (!(currentUser?.noCollapseCommentsFrontpage)) {
      console.log("BAsdf")
      refetch()
    }
  }

  render () {
    const { results, loading, loadMore, networkStatus, updateComment, currentUser, data: { refetch }, threadView = "recentDiscussionThread" } = this.props
  const { showShortformFeed, showSettings } = this.state
    const { SingleColumnSection, SectionTitle, SectionButton, ShortformSubmitForm, Loading, SectionFooter, SectionFooterCheckbox, SettingsIcon } = Components
    
    const loadingMore = networkStatus === 2;

    const { LoadMore } = Components

    if (!loading && results && !results.length) {
      return null
    }

    const limit = (currentUser && currentUser.isAdmin) ? 4 : 3
    const expandCommentsFrontpage = !(currentUser && currentUser.noCollapseCommentsFrontpage)

    return (
      <SingleColumnSection>
        <SectionTitle title="Recent Discussion">
          <SettingsIcon onClick={this.toggleShowSettings}/>
        </SectionTitle>
        {<SectionFooter>
          {currentUser && currentUser.isReviewed && <SectionButton onClick={this.toggleShortformFeed}>
              New Shortform Post
          </SectionButton>}
          <Tooltip title={"Click to expand all comments."}>
            <div>
              <SectionFooterCheckbox 
                onClick={this.toggleExpandComments} 
                value={expandCommentsFrontpage} 
                label={"Expand Comments"} 
                />
            </div>
          </Tooltip>
        </SectionFooter>}
        {showShortformFeed && <ShortformSubmitForm successCallback={refetch}/>}
        <div>
          {results && <div>
            {results.map((post, i) =>
              <Components.RecentDiscussionThread
                expandAll={expandCommentsFrontpage}
                key={post._id}
                post={post}
                postCount={i}
                terms={{view:threadView, postId:post._id, limit}}
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
  withUser);
