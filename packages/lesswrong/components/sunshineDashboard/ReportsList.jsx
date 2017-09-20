import { Components, registerComponent, withEdit } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import { FormattedMessage } from 'meteor/vulcan:i18n';
import Reports from '../../lib/collections/reports/collection.js'

class ReportsList extends Component {
  render () {
    if (this.props.report) {
      return (
        <div className="reports-list">
          {reports.map(report =>
            <Components.ReportItem
              currentUser={currentUser}
              report={report}
              key={report._id}
              newComment={highlightDate && (new Date(comment.createdAt).getTime() > new Date(highlightDate).getTime())}
              editMutation={editMutation}
              />)
          }
        </div>
      )
    } else {
      return (
        <div className="reports-list">
          <p> No unclaimed reports.</p>
        </div>
      )
    }
  }
};

const reportsOptions = {
  collection: Reports,
  queryName: 'selectUnclaimedReportsQuery',
  fragmentName: 'unclaimedReportsList',
  totalResolver: false,
};

ReportsList.displayName = "ReportsList";

const withEditOptions = {
  collection: Reports,
  fragmentName: 'unclaimedReportsList',
};


registerComponent('ReportsList', ReportsList, [withEdit, withEditOptions]);
