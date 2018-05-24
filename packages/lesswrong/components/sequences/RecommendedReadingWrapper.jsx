import { Components, registerComponent, withDocument} from 'meteor/vulcan:core';
import Sequences from '../../lib/collections/sequences/collection.js';
import React from 'react';

const RecommendedReadingWrapper = ({document, loading, post, router, nextTitle, nextLink}) => {
  if (document && !loading) {
    //TODO: Factor out the code in here and SequencesNavigation
    if (document.chapters) {
      let chapters = [...document.chapters].sort((a,b) => ((a.number || 0) - (b.number ||0)));
      let currentChapter = false;
      let currentPostIndex = false;
      let currentChapterIndex = false;
      let currentSequenceLength = document.chapters.length;
      chapters.forEach((c) => {
        if(c.posts && _.pluck(c.posts, '_id').indexOf(post._id) > -1) {
          currentChapter = c
          currentPostIndex = _.pluck(c.posts, '_id').indexOf(post._id);
          currentChapterIndex = _.pluck(chapters, '_id').indexOf(c._id);
        }
      })
      let nextPost = false;
      let previousPost = false;
      if (currentPostIndex || currentPostIndex === 0) {
        
        if (currentPostIndex + 1 < currentChapter.posts.length) {
          nextPost = currentChapter.posts[currentPostIndex + 1]
        } else if (currentChapterIndex + 1 < currentSequenceLength) {
          nextPost = chapters[currentChapterIndex+1].posts[0]
        } else {
          nextLink = nextLink || "/sequences/" + document._id;
          nextTitle = nextTitle || document.title;
        }

        if (currentPostIndex > 0) {
          previousPost = currentChapter.posts[currentPostIndex - 1]
        } else if (currentChapterIndex > 1) {
          previousPost = chapters[currentChapterIndex - 1].posts[document.chapters[currentChapterIndex-1].length - 1];
        }
        return <Components.RecommendedReading sequence={document} chapter={currentChapter} post={post} previousPost={previousPost} nextPost={nextPost} nextTitle={nextTitle} nextLink={nextLink}/>
      }
    }
  } else {
    return <Components.Loading />
  }
};

const options = {
  collection: Sequences,
  queryName: "SequencesNavigationQuery",
  fragmentName: 'SequencesNavigationFragment',
  totalResolver: false,
}

registerComponent('RecommendedReadingWrapper', RecommendedReadingWrapper, [withDocument, options]);
