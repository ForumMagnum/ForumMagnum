import {
  Components,
  registerComponent,
  withList,
  withCurrentUser,
  withEdit
} from 'meteor/vulcan:core';
import React, { Component } from 'react';
import Reports from '../../lib/collections/reports/collection.js';

class SunshineReportedCommentsList extends Component {
  render () {
    const { results, editMutation } = this.props
    if (results && results.length) {
      return (
        <div className="sunshine-reported-comments-list">
          <div className="sunshine-sidebar-title">Flagged Comments</div>
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
  withCurrentUser
);
