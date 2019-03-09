import React from 'react';
import { registerComponent, Components, withList } from 'meteor/vulcan:core';
import Localgroups from '../../lib/collections/localgroups/collection.js';

const LocalGroupsList = ({results, loading, canEdit}) => {
  if (results && !loading) {
    return <div className="local-groups-list">
      {results.map((group) => <Components.LocalGroupsItem key={group._id} group={group} />)}
    </div>
  } else {
    return <Components.Loading />
  }
}

const options = {
  collection: Localgroups,
  queryName: 'localGroupsListQuery',
  fragmentName: 'localGroupsHomeFragment',
  enableTotal: false,
  enableCache: true,
  ssr: true
}

registerComponent('LocalGroupsList', LocalGroupsList, [withList, options])
