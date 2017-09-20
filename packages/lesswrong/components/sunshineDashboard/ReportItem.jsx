import React, { Component } from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';

const ReportItem = (props, context) => {
    return (
      <div className="report-item">
        Reported by { this.props.user.username }
      </div>)
  }

registerComponent('ReportItem', ReportItem);
