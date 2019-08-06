import { Components, registerComponent, withDocument } from 'meteor/vulcan:core';
import React from 'react';
import { Comments } from '../../../lib/collections/comments';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  root: {
    opacity: 0.5,
  },
  meta: {
    fontSize: 12,
    marginLeft: 3,
    fontStyle: "italic",
  },
});

const CommentDeletedMetadata = ({document, classes}) => {
  if (document && document.deleted) {
    const deletedByUsername = document.deletedByUser && document.deletedByUser.displayName;
    return (
      <div className={classes.root}>
        <div className={classes.meta}>
          {deletedByUsername && <span>Deleted by {deletedByUsername}</span>}, {document.deletedDate && <span>
            <Components.CalendarDate date={document.deletedDate}/>
          </span>} 
        </div>
        {document.deletedReason &&
          <div className={classes.meta}>
            Reason: {document.deletedReason}
          </div>
        }
      </div>
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

registerComponent('CommentDeletedMetadata', CommentDeletedMetadata,
  withStyles(styles, {name: "CommentDeletedMetadata"}),
  [withDocument, options]);
