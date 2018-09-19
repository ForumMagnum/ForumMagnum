import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Components, registerComponent, withList } from 'meteor/vulcan:core';
import MenuItem from '@material-ui/core/MenuItem'
import LWEvents from '../../lib/collections/lwevents/collection.js'
import moment from 'moment';
import defineComponent from '../../lib/defineComponent';
import withUser from '../common/withUser';

class LastVisitList extends Component {
  render() {
    const { results, loading, clickCallback } = this.props
    if (!loading && results) {
      return (results.map((event) =>
          <MenuItem key={event._id} dense onClick={() => clickCallback(event.createdAt)}>Visit at: {moment(event.createdAt).calendar().toString()} </MenuItem>
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
  totalResolver: false,
  enableCache: true,
};

export default defineComponent({
  name: "LastVisitList",
  component: LastVisitList,
  hocs: [ withUser, [withList, options] ]
});
