import React from 'react';
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen";
import { registerComponent } from '../../../lib/vulcan-lib/components';
import CalendarDate from "../../common/CalendarDate";

const DeletedCommentsMetaDataQuery = gql(`
  query CommentDeletedMetadata($documentId: String) {
    comment(input: { selector: { documentId: $documentId } }) {
      result {
        ...DeletedCommentsMetaData
      }
    }
  }
`);

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
  const { data } = useQuery(DeletedCommentsMetaDataQuery, {
    variables: { documentId: documentId },
  });
  const document = data?.comment?.result;
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

export default registerComponent(
  'CommentDeletedMetadata', CommentDeletedMetadata, {styles}
);



