import React, { Component } from 'react';
import PropTypes from 'prop-types'
import { registerComponent, Components, withList } from 'meteor/vulcan:core';
import Chapters from '../../lib/collections/chapters/collection.js';
import defineComponent from '../../lib/defineComponent';
import ChaptersItem from './ChaptersItem';

const ChaptersList = ({results, loading, canEdit}) => {
  if (results && !loading) {
    return <div className="chapters-list">
      {results.map((chapter) => <ChaptersItem key={chapter._id} chapter={chapter} canEdit={canEdit} />)}
    </div>
  } else {
    return <Components.Loading />
  }
}

const options = {
  collection: Chapters,
  queryName: 'chaptersListQuery',
  fragmentName: 'ChaptersFragment',
  totalResolver: false,
  enableCache: true,
}

export default defineComponent({
  name: 'ChaptersList',
  component: ChaptersList,
  register: false,
  hocs: [ [withList, options ] ]
})
