import { Components, registerComponent, withList } from 'meteor/vulcan:core';
import Sequences from '../../lib/collections/sequences/collection.js';
import IconButton from 'material-ui/IconButton'
import { withRouter } from 'react-router';
import React from 'react';

const SequencesNavigation = ({
    results,
    loading,
    post,
    router,
    nextPostId,
    prevPostId,
    title
  }) => {
    let document = null
    let prevPostUrl = ""
    let nextPostUrl = ""

    if (results && results[0]._id) {
      document = results[0]
    }

    if (document && !title) {
      title = document.title
    }
    if (document && post) {
      if (document.chapters) {
        let currentChapter = false;
        let currentPostIndex = false;
        let currentChapterIndex = false;
        let currentSequenceLength = document.chapters.length;
        document.chapters.forEach((c) => {
          if(c.posts && _.pluck(c.posts, '_id').indexOf(post._id) > -1) {
            currentChapter = c
            currentPostIndex = _.pluck(c.posts, '_id').indexOf(post._id);
            currentChapterIndex = _.pluck(document.chapters, '._id').indexOf(c._id);
          }
        })
        if (currentPostIndex || currentPostIndex === 0) {
          if (currentPostIndex + 1 < currentChapter.posts.length) {
            nextPostId = currentChapter.posts[currentPostIndex + 1]._id
            nextPostUrl = "/s/" + document._id + "/p/" + nextPostId;
          } else if (currentChapterIndex + 1 < currentSequenceLength) {
            nextPostId = document.chapters[currentChapterIndex + 1].posts[0]._id
            nextPostUrl = "/s/" + document._id + "/p/" + nextPostId;
          } else {
            nextPostUrl = "/sequences/" + document._id;
          }

          if (currentPostIndex > 0) {
            prevPostId = currentChapter.posts[currentPostIndex - 1]._id
            prevPostUrl = "/s/" + document._id + "/p/" + prevPostId;
          } else if (currentChapterIndex > 1) {
            prevPostId = document.chapters[currentChapterIndex - 1].posts[document.chapters[currentChapterIndex-1].length - 1]._id
            prevPostUrl = "/s/" + document._id + "/p/" + prevPostId;
          } else {
            prevPostUrl = "/s/" + document._id + "/p/" + document._id;
          }
        }
      }
    }
    return (
      <div className="sequences-navigation-top">
        <Components.SequencesNavigationLink
                          documentId={prevPostId}
                          documentUrl={prevPostUrl}
                          direction="left" />

                        <div className="sequences-navigation-title">
                          {title ? title : <Components.Loading/>}
                        </div>

        <Components.SequencesNavigationLink
                          documentId={nextPostId}
                          documentUrl={nextPostUrl}
                          direction="right" />
      </div>
    )
  }


const options = {
  collection: Sequences,
  queryName: "SequencesNavigationQuery",
  fragmentName: 'SequencesNavigationFragment',
  totalResolver: false,
}

registerComponent('SequencesNavigation', SequencesNavigation, [withList, options], withRouter);
