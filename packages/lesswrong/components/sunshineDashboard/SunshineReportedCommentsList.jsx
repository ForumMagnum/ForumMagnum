import {
  Components,
  registerComponent,
  withList,
  withEdit
} from 'meteor/vulcan:core';
import React, { Component } from 'react';
import Reports from '../../lib/collections/reports/collection.js';
import { withStyles } from '@material-ui/core/styles';
import withUser from '../common/withUser';

const styles = theme => ({
  root: {
    backgroundColor: "rgba(60,0,0,.04)"
  }
})

class SunshineReportedCommentsList extends Component {
  render () {
    const { results, editMutation, classes } = this.props
    if (results && results.length) {
      return (
        <div className={classes.root}>
          <Components.SunshineListTitle>Flagged Comments</Components.SunshineListTitle>
          {results.map(report =>
            <div key={report._id} >
              <Components.SunshineReportsItem
                report={report}
                reportEditMutation={editMutation}
              />
            </div>
          )}
        </div>
      )
    } else {
      return null
    }
  }
}

const withListOptions = {
  collection: Reports,
  queryName: 'sunshineCommentsListQuery',
  fragmentName: 'unclaimedReportsList',
};

const withEditOptions = {
  collection: Reports,
  fragmentName: 'unclaimedReportsList',
}

registerComponent(
  'SunshineReportedCommentsList',
  SunshineReportedCommentsList,
  [withList, withListOptions],
  [withEdit, withEditOptions],
  withUser,
  withStyles(styles, {name:"SunshineReportedCommentsList"})
);
