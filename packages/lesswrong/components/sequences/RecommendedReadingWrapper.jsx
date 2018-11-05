import { Components, registerComponent, withDocument, Utils} from 'meteor/vulcan:core';
import Sequences from '../../lib/collections/sequences/collection.js';
import React from 'react';

const RecommendedReadingWrapper = ({document, loading, post, router, nextTitle, nextLink}) => {
  if (document && !loading){
    const { currentChapter, prevPost, nextPost } = Utils.getSequencePostLinks(document, post)
    return <Components.RecommendedReading sequence={document} chapter={currentChapter} post={post} previousPost={prevPost} nextPost={nextPost} nextTitle={nextTitle} nextLink={nextLink}/>
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

registerComponent('RecommendedReadingWrapper', RecommendedReadingWrapper, [withDocument, options]);
