import { Components, registerComponent, withCurrentUser} from 'meteor/vulcan:core';
import React from 'react';

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

registerComponent('AllComments', AllComments, withCurrentUser);
