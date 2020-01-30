import { Components, registerComponent } from 'meteor/vulcan:core';
import { withMulti } from '../../lib/crud/withMulti';
import React, { Component } from 'react';
import { Posts } from '../../lib/collections/posts';

class LastCuratedDate extends Component {
  render () {
    const { results } = this.props
    const { MetaInfo, FormatDate } = Components
    const curatedDate = results && results.length && results[0].curatedDate
    if (curatedDate) {
      return <div>
        <MetaInfo>
          <FormatDate date={results[0].curatedDate}/>
        </MetaInfo>
      </div>
    } else {
      return null
    }
  }
}


const withListOptions = {
  collection: Posts,
  queryName: 'lastCuratedPost',
  fragmentName: 'PostsList',
};


registerComponent(
  'LastCuratedDate',
  LastCuratedDate,
  [withMulti, withListOptions],
);
