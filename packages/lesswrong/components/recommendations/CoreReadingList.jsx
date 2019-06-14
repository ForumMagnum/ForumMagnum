import React, { Component } from 'react';
import { Components, registerComponent, withMulti } from 'meteor/vulcan:core';
import withUser from '../common/withUser';
import { withDismissRecommendation } from './withDismissRecommendation';
import { Posts } from '../../lib/collections/posts';

class CoreReadingList extends Component {
  
  render() {
    const { continueReading, continueReadingLoading, results, loading } = this.props;
    const { PostsItem2, PostsLoading, Loading } = Components;

    if (!results && loading) return <Loading />
    if (!results && !loading) return null

    if (continueReadingLoading || !continueReading)
      return <PostsLoading/>
        
    return <div>
      {coreReadingPosts.map(resumeReading => {
        const { nextPost, sequence, collection } = resumeReading;
        return <PostsItem2
          post={nextPost}
          sequenceId={sequence?._id}
          resumeReading={resumeReading}
          dismissRecommendation={() => this.dismissAndHideRecommendation(nextPost._id)}
          key={sequence?._id || collection?._id}
        />
      })}
    </div>
  }
}

const withMultiOptions = {
  collection: Posts,
  queryName: 'postsListQuery',
  fragmentName: 'PostsList',
  enableTotal: false,
  enableCache: true,
  fetchPolicy: 'cache-and-network',
  ssr: true
};

registerComponent('CoreReadingList', CoreReadingList,
  withDismissRecommendation,
  withUser,
  [withMulti, withMultiOptions]
);

