import {
  Components,
  registerComponent,
  withList,
  withCurrentUser,
  withEdit
} from 'meteor/vulcan:core';
import React, { Component } from 'react';
import Reports from '../../lib/collections/reports/collection.js';
import defineComponent from '../../lib/defineComponent';
import PropTypes from 'prop-types';

const styles = theme => ({
  root: {
    backgroundColor: "rgba(60,0,0,.08)"
  }
})

class SunshineReportedCommentsList extends Component {
  render () {
    const { results, editMutation, classes } = this.props
    if (results && results.length) {
      return (
        <div className={classes.root}>
          <Components.SunshineListTitle>
            Flagged Comments
          </Components.SunshineListTitle>
          {results.map(report =>
            <div key={report._id} >
              <Components.SunshineReportedCommentsItem
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

SunshineReportedCommentsList.propTypes = {
  results: PropTypes.array,
  editMutation: PropTypes.func.isRequired,
  classes: PropTypes.object.isRequired,
};

const withListOptions = {
  collection: Reports,
  queryName: 'sunshineCommentsListQuery',
  fragmentName: 'unclaimedReportsList',
};

const withEditOptions = {
  collection: Reports,
  fragmentName: 'unclaimedReportsList',
}

export default defineComponent({
  name: 'SunshineReportedCommentsList',
  component: SunshineReportedCommentsList,
  styles: styles,
  hocs: [ [withList, withListOptions], [withEdit, withEditOptions], withCurrentUser ]
});
