import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Components } from 'meteor/vulcan:core';
import { Link } from 'react-router';
import defineComponent from '../../lib/defineComponent';

const LocalGroupsItem = ({group}) => {
  if (group) {
    return <div className="local-groups-item">
        <Link to={"groups/" + group._id} >
          <span className="local-groups-item-title">[Group] {group.name}</span>
          {/* {group.organizers.map((organizer) => <span key={organizer._id} className="local-group-organizer">{organizer.displayName} </span>)} */}
          <span className="local-groups-item-location">{ group.location }</span>
        </Link>
      </div>
  } else {
    return null
  }
}

export default defineComponent({
  name: 'LocalGroupsItem',
  component: LocalGroupsItem
})
