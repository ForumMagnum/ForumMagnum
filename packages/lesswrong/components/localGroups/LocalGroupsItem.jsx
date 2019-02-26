import React from 'react';
import { registerComponent } from 'meteor/vulcan:core';
import { Link } from 'react-router';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  title: {
    fontSize: "1.4rem",
    lineHeight: "1.4rem",
    marginBottom: 5,
    fontWeight: 400,
    paddingTop: 10,
    overflow: "hidden",
    textOverflow: "ellipsis",
    textDecoration: "none",
    whiteSpace: "nowrap",
    zIndex: "400 !important",
    marginRight:10,
  }
});

const LocalGroupsItem = ({group, classes}) => {
  if (group) {
    return <div className="local-groups-item">
        <Link to={"groups/" + group._id} >
          <span className={classes.title}>[Group] {group.name}</span>
          {/* {group.organizers.map((organizer) => <span key={organizer._id} className="local-group-organizer">{organizer.displayName} </span>)} */}
          <span className="local-groups-item-location">{ group.location }</span>
        </Link>
      </div>
  } else {
    return null
  }
}

registerComponent('LocalGroupsItem', LocalGroupsItem,
  withStyles(styles, {name: "LocalGroupsItem"}))
