import { Components, registerComponent, withDocument } from 'meteor/vulcan:core';
import React from 'react';
import { Comments } from '../../lib/collections/comments';

const RecentCommentsSingle = (props) => {
  if (props.document && !props.loading) {
    return <Components.RecentCommentsItem {...props} comment={props.document}/>
  } else {
    return <Components.Loading />
  }
}

const documentOptions = {
  collection: Comments,
  queryName: 'RecentCommentsQuery',
  fragmentName: 'SelectCommentsList',
};

registerComponent('RecentCommentsSingle', RecentCommentsSingle, [withDocument, documentOptions]);
