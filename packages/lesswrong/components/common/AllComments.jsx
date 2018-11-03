import { Components, registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import withUser from '../common/withUser';

const AllComments = (props, context) => {
  return (
    <div className="all-posts">
      <Components.Section title="All Comments">
        <Components.RecentComments />
      </Components.Section>
    </div>
  )
};

registerComponent('AllComments', AllComments, withUser);
