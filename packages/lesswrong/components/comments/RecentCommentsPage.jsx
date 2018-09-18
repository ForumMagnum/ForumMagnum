import { Components } from 'meteor/vulcan:core';
import React from 'react';
import defineComponent from '../../lib/defineComponent';

const RecentCommentsPage = (props, context) => {
  const terms = _.isEmpty(props.location && props.location.query) ? {view: 'recentComments', limit: 100}: props.location.query;

  return (
    <div className="recent-comments-page">
      <Components.RecentComments terms={terms}/>
    </div>
  )
};

export default defineComponent({
  name: 'RecentCommentsPage',
  component: RecentCommentsPage,
  register: false
});
