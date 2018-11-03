import { Components, registerComponent, withDocument } from 'meteor/vulcan:core';
import React from 'react';
import { Comments } from '../../../lib/collections/comments';

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
          {document.deletedDate && <span>
            <Components.CalendarDate date={document.deletedDate}/>
          </span>}
        </span>
      </p>
    )
  } else {
    return null
  }
};

CommentDeletedMetadata.displayName = "CommentDeletedMetadata";

const options = {
  collection: Comments,
  queryName: 'CommentsDeletedMetadataQuery',
  fragmentName: 'DeletedCommentsMetaData',
};

registerComponent('CommentDeletedMetadata', CommentDeletedMetadata, [withDocument, options]);
