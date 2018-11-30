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
import PropTypes from 'prop-types';

const styles = theme => ({
  root: {
    backgroundColor: "rgba(60,0,0,.08)"
  }
})

class SunshineReportedContentList extends Component {
  render () {
    const { results, editMutation, classes } = this.props
    if (results && results.length) {
      return (
        <div className={classes.root}>
          <Components.SunshineListTitle>
            Flagged Content
          </Components.SunshineListTitle>
          {results.map(report =>
            <div key={report._id} >
              <Components.SunshineReportedItem
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

SunshineReportedContentList.propTypes = {
  results: PropTypes.array,
  editMutation: PropTypes.func.isRequired,
  classes: PropTypes.object.isRequired,
};

const withListOptions = {
  collection: Reports,
  queryName: 'sunshineReportsListQuery',
  fragmentName: 'unclaimedReportsList',
};

const withEditOptions = {
  collection: Reports,
  fragmentName: 'unclaimedReportsList',
}

registerComponent(
  'SunshineReportedContentList',
  SunshineReportedContentList,
  [withList, withListOptions],
  [withEdit, withEditOptions],
  withUser,
  withStyles(styles, {name:"SunshineReportedContentList"})
);
