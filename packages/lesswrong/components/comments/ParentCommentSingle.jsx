import { Components, registerComponent, withDocument } from 'meteor/vulcan:core';
import React from 'react';
import { Comments } from '../../lib/collections/comments';

const ParentCommentSingle = (props) => {
  if (props.document && !props.loading) {
    return <Components.ParentCommentItem {...props} comment={props.document}/>
  } else {
    return <Components.Loading />
  }
}

const documentOptions = {
  collection: Comments,
  queryName: 'ParentCommentQuery',
  fragmentName: 'SelectCommentsList',
};

registerComponent('ParentCommentSingle', ParentCommentSingle, [withDocument, documentOptions]);
