import { Components, withDocument } from 'meteor/vulcan:core';
import React from 'react';
import moment from 'moment';
import { Comments } from 'meteor/example-forum';
import defineComponent from '../../../lib/defineComponent';

const CommentDeletedMetadata = ({document}) => {
  if (document && document.deleted) {
    const deletedByUsername = document.deletedByUser && document.deletedByUser.displayName;
    return (
      <p className="comments-item-deleted-info">
        {document.deletedReason &&
          <span className="comments-item-deleted-info-reason">
            Reason: {document.deletedReason}
          </span>
        }
        <span className="comments-item-deleted-info-meta">
          {deletedByUsername && <span> by {deletedByUsername}</span>}
          {document.deletedDate && <span> {moment(new Date(document.deletedDate)).calendar()}</span>}
        </span>
      </p>
    )
  } else {
    return null
  }
};

const options = {
  collection: Comments,
  queryName: 'CommentsDeletedMetadataQuery',
  fragmentName: 'DeletedCommentsMetaData',
};

export default defineComponent({
  name: 'CommentDeletedMetadata',
  component: CommentDeletedMetadata,
  hocs: [ [withDocument, options] ]
});
