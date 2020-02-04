import React from 'react';
import { registerComponent, Components } from 'meteor/vulcan:core';
import { withMulti } from '../../lib/crud/withMulti';
import Chapters from '../../lib/collections/chapters/collection';

const ChaptersList = ({results, loading, canEdit}) => {
  if (results && !loading) {
    return <div className="chapters-list">
      {results.map((chapter) => <Components.ChaptersItem key={chapter._id} chapter={chapter} canEdit={canEdit} />)}
    </div>
  } else {
    return <Components.Loading />
  }
}

const options = {
  collection: Chapters,
  queryName: 'chaptersListQuery',
  fragmentName: 'ChaptersFragment',
  enableTotal: false,
  ssr: true,
}

registerComponent('ChaptersList', ChaptersList, [withMulti, options])
