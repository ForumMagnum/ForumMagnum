import React from 'react';
import { registerComponent } from 'meteor/vulcan:core';
import { Link } from 'react-router';
import { withStyles } from '@material-ui/core/styles';
import { legacyBreakpoints } from '../../lib/modules/utils/theme';

const styles = theme => ({
  root: {
    marginLeft: 13,
    fontSize: 14,
    paddingLeft: 10,
    paddingBottom: 5,
  
    [legacyBreakpoints.maxTiny]: {
        marginLeft: 0,
        paddingLeft: 0,
    },
  
    "& a:hover": {
      textDecoration: "none",
      color: "rgba(0,0,0,.4)",
    },
  },
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
  },
  location: {
    color: "rgba(0,0,0,.4)",
    marginRight: 8,
  },
});

const LocalGroupsItem = ({group, classes}) => {
  if (group) {
    return <div className={classes.root}>
        <Link to={"groups/" + group._id} >
          <span className={classes.title}>[Group] {group.name}</span>
          {/* {group.organizers.map((organizer) => <span key={organizer._id} className="local-group-organizer">{organizer.displayName} </span>)} */}
          <span className={classes.location}>{ group.location }</span>
        </Link>
      </div>
  } else {
    return null
  }
}

registerComponent('LocalGroupsItem', LocalGroupsItem,
  withStyles(styles, {name: "LocalGroupsItem"}))
