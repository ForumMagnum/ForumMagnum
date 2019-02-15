import { Components, registerComponent, withDocument } from 'meteor/vulcan:core';
import React from 'react';
import { Comments } from '../../../lib/collections/comments';

const CommentDeletedMetadata = ({document}) => {
  if (document && document.deleted) {
    const deletedByUsername = document.deletedByUser && document.deletedByUser.displayName;
    return (
      <div className="comments-item-deleted-info">
        <div className="comments-item-deleted-info-meta">
          {deletedByUsername && <span>Deleted by {deletedByUsername}</span>}, {document.deletedDate && <span>
            <Components.CalendarDate date={document.deletedDate}/>
          </span>} 
        </div>
        {document.deletedReason &&
          <div className="comments-item-deleted-info-meta">
            Reason: {document.deletedReason}
          </div>
        }
      </div>
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
