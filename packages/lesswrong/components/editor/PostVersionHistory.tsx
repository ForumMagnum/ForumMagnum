import React, {useState} from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useDialog } from '../common/withDialog';
import { useMulti } from '../../lib/crud/withMulti';
import { useSingle } from '../../lib/crud/withSingle';
import Button from '@material-ui/core/Button';
import classNames from 'classnames';

const styles = (theme: ThemeType): JssStyles => ({
  versionHistoryDialog: {
    width: "80vw",
    height: "80vh",
    position: "relative",
  },
  
  leftColumn: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 200,
    overflowY: "scroll",
  },
  closeButton: {
  },
  revisionRow: {
    padding: 16,
    cursor: "pointer",
  },
  selectedRevision: {
    background: "#eee",
  },
  versionNumber: {
  },
  editedAt: {
  },
  selectedRevisionDisplay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 200,
    right: 0,
    overflowY: "scroll",
    padding: 16,
  },
});

const PostVersionHistoryButton = ({postId, classes}: {
  postId: string,
  classes: ClassesType
}) => {
  const { openDialog } = useDialog();
  return <Button
    onClick={() => {
      openDialog({
        componentName: "PostVersionHistory",
        componentProps: {postId}
      })
    }}
  >
    Version History
  </Button>
}

const PostVersionHistory = ({postId, onClose, classes}: {
  postId: string,
  onClose: ()=>void,
  classes: ClassesType
}) => {
  const { LWDialog, Loading, ContentItemBody } = Components;
  const [selectedRevisionId,setSelectedRevisionId] = useState<string|null>(null);
  
  const { results: revisions, loading: loadingRevisions, loadMoreProps } = useMulti({
    terms: {
      view: "revisionsOnDocument",
      documentId: postId,
      fieldName: "contents",
    },
    fetchPolicy: "cache-then-network" as any,
    collectionName: "Revisions",
    fragmentName: "RevisionMetadataWithChangeMetrics",
  });
  
  const { document: revision, loading: loadingRevision } = useSingle({
    skip: !selectedRevisionId,
    documentId: selectedRevisionId||"",
    collectionName: "Revisions",
    fetchPolicy: "cache-first",
    fragmentName: "RevisionDisplay",
  });
  
  return <LWDialog open={true}>
    <div className={classes.versionHistoryDialog}>
      <div className={classes.leftColumn}>
        {loadingRevisions && <Loading/>}
        {revisions && revisions.map(rev =>
          <div key={rev._id}
            className={classNames(classes.revisionRow, {
              [classes.selectedRevision]: rev._id===selectedRevisionId,
            })}
            onClick={() => setSelectedRevisionId(rev._id)}
          >
            <div className={classes.versionNumber}>{rev.version}</div>
            <div className={classes.editedAt}>{rev.editedAt}</div>
          </div>
        )}
      
        <div className={classes.closeButton}>
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
      <div className={classes.selectedRevisionDisplay}>
        {revision && <ContentItemBody
          dangerouslySetInnerHTML={{__html: revision.html}}
          description="PostVersionHistory revision"
        />}
      </div>
    </div>
  </LWDialog>
}

const PostVersionHistoryButtonComponent = registerComponent("PostVersionHistoryButton", PostVersionHistoryButton, {styles});
const PostVersionHistoryComponent = registerComponent("PostVersionHistory", PostVersionHistory, {styles});

declare global {
  interface ComponentTypes {
    PostVersionHistoryButton: typeof PostVersionHistoryButtonComponent
    PostVersionHistory: typeof PostVersionHistoryComponent
  }
}
