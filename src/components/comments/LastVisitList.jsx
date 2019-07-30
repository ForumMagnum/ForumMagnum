import React, { Component } from 'react';
import { Components, registerComponent, withList } from 'meteor/vulcan:core';
import MenuItem from '@material-ui/core/MenuItem'
import { LWEvents } from '../../lib/collections/lwevents/collection.js'
import withUser from '../common/withUser';

class LastVisitList extends Component {
  render() {
    const { results, loading, clickCallback } = this.props
    if (!loading && results) {
      return (results.map((event) =>
          <MenuItem key={event._id} dense onClick={() => clickCallback(event.createdAt)}>Visit at: <Components.CalendarDate date={event.createdAt}/> </MenuItem>
        ))
    } else {
      return <Components.Loading />
    }
  }
}

const options = {
  collection: LWEvents,
  queryName: 'LastVisitListFragment',
  fragmentName: 'lastEventFragment',
  enableTotal: false,
  enableCache: true,
};

registerComponent("LastVisitList", LastVisitList, withUser, [withList, options]);
