import { Components, getRawComponent, withDocument } from 'meteor/vulcan:core';
import React from 'react';
import { Comments } from "meteor/example-forum";
import defineComponent from '../../lib/defineComponent';

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

export default defineComponent({
  name: 'RecentCommentsSingle',
  component: RecentCommentsSingle,
  hocs: [ [withDocument, documentOptions] ]
});
