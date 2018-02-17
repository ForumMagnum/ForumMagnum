import { Components, registerComponent, withDocument } from 'meteor/vulcan:core';
import React from 'react';
import moment from 'moment';
import Users from 'meteor/vulcan:users';

const CommentDeletedMetadata = ({document}) => {
  if (document && document.deleted) {
    const deletedByUsername = document.deletedByUser.displayName

    return (
      <div className="comment-item-deleted-info">
        Deleted
        {document.deletedByUsername && <span> by {deletedByUsername}</span>}
        {document.deletedDate && <span> at {moment(new Date(document.deletedDate)).calendar()}</span>}
        {document.deletedReason && <span>, with reason: {document.deletedReason}</span>}
      </div>
    )
  } else {
    return null
  }
};

CommentDeletedMetadata.displayName = "CommentDeletedMetadata";

const options = {
  collection: Users,
  queryName: 'LWPostsPageSlugQuery',
  fragmentName: 'LWPostsPage',
};

registerComponent('CommentDeletedMetadata', CommentDeletedMetadata, [withDocument, options]);
