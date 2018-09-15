import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Components, withList } from 'meteor/vulcan:core';
import Localgroups from '../../lib/collections/localgroups/collection.js';
import defineComponent from '../../lib/defineComponent';

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
  totalResolver: false,
  enableCache: true,
}

export default defineComponent({
  name: 'LocalGroupsList',
  component: LocalGroupsList,
  hocs: [ [withList, options] ]
});
