import { Components, withCurrentUser } from 'meteor/vulcan:core';
import React from 'react';
import defineComponent from '../../lib/defineComponent';

const AllComments = (props, context) => {
  const commentTerms = _.isEmpty(props.location && props.location.query) ? {view: 'recentComments', limit: 20}: props.location.query;
  return (
    <div className="all-posts">
      <Components.Section title="All Comments"
        titleComponent= {<div className="recent-posts-title-component">
          sorted by<br /> <Components.CommentsViews />
        </div>} >
        <Components.RecentComments terms={commentTerms} fontSize="small" />
      </Components.Section>
    </div>
  )
};

export default defineComponent({
  name: 'AllComments',
  component: AllComments,
  hocs: [ withCurrentUser ]
});
