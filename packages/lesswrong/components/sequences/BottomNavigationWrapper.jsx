import { Components, registerComponent, withDocument, Utils} from 'meteor/vulcan:core';
import Sequences from '../../lib/collections/sequences/collection.js';
import React from 'react';
import withErrorBoundary from '../common/withErrorBoundary.jsx';

const BottomNavigationWrapper = ({document, loading, post, router, nextTitle, nextLink}) => {
  if (document && !loading){
    const { currentChapter, prevPost, nextPost } = Utils.getSequencePostLinks(document, post)
    return <Components.BottomNavigation sequence={document} chapter={currentChapter} post={post} previousPost={prevPost} nextPost={nextPost} nextTitle={nextTitle} nextLink={nextLink}/>
  } else {
    return <Components.Loading />
  }
};

const options = {
  collection: Sequences,
  queryName: "SequencesNavigationQuery",
  fragmentName: 'SequencesNavigationFragment',
  enableTotal: false,
  ssr: true,
}

registerComponent('BottomNavigationWrapper', BottomNavigationWrapper, [withDocument, options], withErrorBoundary);
