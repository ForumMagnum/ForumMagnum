import { Components, registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import { parseQuery } from '../../lib/routeUtil';

const styles = theme => ({
  root: {
    maxWidth: 800,
    marginLeft: "auto",
    marginRight: "auto",
  },
});

const RecentCommentsPage = ({location, classes}) => {
  const query = parseQuery(location)
  const terms = _.isEmpty(query) ? {view: 'recentComments', limit: 100}: query;

  return (
    <div className={classes.root}>
      <Components.RecentComments terms={terms}/>
    </div>
  )
};

registerComponent('RecentCommentsPage', RecentCommentsPage,
  withStyles(styles, { name: "RecentCommentsPage" }));
