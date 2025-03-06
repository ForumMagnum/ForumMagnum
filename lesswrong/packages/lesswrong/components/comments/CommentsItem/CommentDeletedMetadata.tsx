import { Components, registerComponent } from '../../../lib/vulcan-lib/components';
import { useSingle } from '../../../lib/crud/withSingle';
import React from 'react';
import CalendarDate from "@/components/common/CalendarDate";

const styles = (theme: ThemeType) => ({
  root: {
    opacity: 0.5,
  },
  meta: {
    fontSize: 12,
    marginLeft: 3,
    fontStyle: "italic",
  },
});

const CommentDeletedMetadata = ({documentId, classes}: {
  documentId: string,
  classes: ClassesType<typeof styles>,
}) => {
  const { document } = useSingle({
    documentId,
    collectionName: "Comments",
    fragmentName: 'DeletedCommentsMetaData',
  });
  if (document && document.deleted) {
    const deletedByUsername = document.deletedByUser && document.deletedByUser.displayName;
    return (
      <div className={classes.root}>
        <div className={classes.meta}>
          {deletedByUsername && <span>Deleted by {deletedByUsername}</span>}, {document.deletedDate && <span>
            <CalendarDate date={document.deletedDate}/>
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

const CommentDeletedMetadataComponent = registerComponent(
  'CommentDeletedMetadata', CommentDeletedMetadata, {styles}
);

declare global {
  interface ComponentTypes {
    CommentDeletedMetadata: typeof CommentDeletedMetadataComponent,
  }
}

export default CommentDeletedMetadataComponent;

