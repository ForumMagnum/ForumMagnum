import {
  Components,
  registerComponent,
  withList,
  withUpdate
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
    const { results, updateReport, classes, totalCount } = this.props
    const { SunshineListTitle, SunshineReportedItem, SunshineListCount } = Components
    if (results && results.length) {
      return (
        <div className={classes.root}>
          <SunshineListTitle>
            Flagged Content <SunshineListCount count={totalCount} />
          </SunshineListTitle>
          {results.map(report =>
            <div key={report._id} >
              <SunshineReportedItem
                report={report}
                updateReport={updateReport}
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
  updateReport: PropTypes.func.isRequired,
  classes: PropTypes.object.isRequired,
};

const withListOptions = {
  collection: Reports,
  queryName: 'sunshineReportsListQuery',
  fragmentName: 'unclaimedReportsList',
  enableTotal: true,
};

const withUpdateOptions = {
  collection: Reports,
  fragmentName: 'unclaimedReportsList',
}

registerComponent(
  'SunshineReportedContentList',
  SunshineReportedContentList,
  [withList, withListOptions],
  [withUpdate, withUpdateOptions],
  withUser,
  withStyles(styles, {name:"SunshineReportedContentList"})
);
