import React, { PropTypes, Component } from 'react';
import { registerComponent, Components, withList } from 'meteor/vulcan:core';
import Localgroups from '../../lib/collections/localgroups/collection.js';
import { Link } from 'react-router';

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

registerComponent('LocalGroupsItem', LocalGroupsItem)
