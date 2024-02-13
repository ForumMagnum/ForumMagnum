import React, {useCallback, useEffect, useState} from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { fragmentTextForQuery } from '../../lib/vulcan-lib/fragments';
import { useDialog } from '../common/withDialog';
import { useMulti } from '../../lib/crud/withMulti';
import { useSingle } from '../../lib/crud/withSingle';
import Button from '@material-ui/core/Button';
import classNames from 'classnames';
import {CENTRAL_COLUMN_WIDTH} from "../posts/PostsPage/PostsPage";
import {commentBodyStyles, postBodyStyles} from "../../themes/stylePiping";
import {useMessages} from "../common/withMessages";
import { useMutation, gql } from '@apollo/client';
import { useTracking } from '../../lib/analyticsEvents';
import { useCurrentUser } from '../common/withUser';
import { canUserEditPostMetadata } from '../../lib/collections/posts/helpers';
import { isFriendlyUI } from '../../themes/forumTheme';

const LEFT_COLUMN_WIDTH = 160

const styles = (theme: ThemeType) => ({
  root: {
    width: CENTRAL_COLUMN_WIDTH + LEFT_COLUMN_WIDTH + 64, //should import post
    display: "flex",
    padding: 24,
    justifyContent: 'space-between'
  },
  leftColumn: {
    ...commentBodyStyles(theme),
  },
  revisionRow: {
    padding: 12,
    cursor: "pointer",
  },
  selectedRevision: {
    background: theme.palette.grey[200],
  },
  versionNumber: {
    color: theme.palette.grey[900],
    marginRight: 8
  },
  editedAt: {
    color: theme.palette.grey[600],
    marginLeft: 8
  },
  selectedRevisionDisplay: {
    width: CENTRAL_COLUMN_WIDTH,
    ...postBodyStyles(theme)
  },
  titleRow: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "16px"
  },
  button: {
    margin: '16px 0'
  },
  loadMore: {
    paddingLeft: 12
  }
});

const PostVersionHistoryButton = ({post, postId, classes}: {
  post: PostsBase,
  postId: string,
  classes: ClassesType
}) => {
  const { openDialog } = useDialog();
  const { captureEvent } = useTracking()

  return <Button
    onClick={() => {
      captureEvent("versionHistoryButtonClicked", {postId})
      openDialog({
        componentName: "PostVersionHistory",
        componentProps: {post, postId},
      })
    }}
  >
    Version History
  </Button>
}

const PostVersionHistory = ({post, postId, onClose, classes}: {
  post: PostsBase,
  postId: string,
  onClose: () => void,
  classes: ClassesType<typeof styles>
}) => {
  const { LWDialog, Loading, ContentItemBody, FormatDate, LoadMore, ChangeMetricsDisplay, EAButton } = Components;
  const ButtonComponent = isFriendlyUI ? EAButton : Button;

  const currentUser = useCurrentUser();
  const { captureEvent } = useTracking()

  const [selectedRevisionId,setSelectedRevisionId] = useState<string|null>(null);
  const [revertInProgress,setRevertInProgress] = useState(false);

  const [revertMutation] = useMutation(gql`
    mutation revertToRevision($postId: String!, $revisionId: String!) {
      revertPostToRevision(postId: $postId, revisionId: $revisionId) {
        ...PostsEdit
      }
    }
    ${fragmentTextForQuery("PostsEdit")}
  `);
  const canRevert = canUserEditPostMetadata(currentUser, post);

  const { results: revisions, loading: loadingRevisions, loadMoreProps } = useMulti({
    terms: {
      view: "revisionsOnDocument",
      documentId: postId,
      fieldName: "contents",
    },
    fetchPolicy: "cache-and-network" as any,
    collectionName: "Revisions",
    fragmentName: "RevisionMetadataWithChangeMetrics",
  });

  useEffect(() => {
    revisions && revisions.length > 0 && setSelectedRevisionId(revisions[0]._id)
  }, [revisions])

  const restoreVersion = useCallback(async () => {
    captureEvent("restoreVersionClicked", {postId, revisionId: selectedRevisionId})
    setRevertInProgress(true);
    await revertMutation({
      variables: {
        postId: postId,
        revisionId: selectedRevisionId,
      },
    });
    // Hard-refresh the page to get things back in sync
    location.reload();
  }, [captureEvent, postId, revertMutation, selectedRevisionId])

  const { document: revision } = useSingle({
    skip: !selectedRevisionId,
    documentId: selectedRevisionId||"",
    collectionName: "Revisions",
    fetchPolicy: "cache-first",
    fragmentName: "RevisionDisplay",
  });

  const liveRevisionId = 

  return (
    <LWDialog open={true} maxWidth={false} onClose={onClose}>
      <div className={classes.root}>
        <div className={classes.leftColumn}>
          {loadingRevisions && <Loading />}
          {revisions &&
            revisions.map((rev) => (
              <div
                key={rev._id}
                className={classNames(classes.revisionRow, {
                  [classes.selectedRevision]: rev._id === selectedRevisionId,
                })}
                onClick={() => setSelectedRevisionId(rev._id)}
              >
                <span className={classes.versionNumber}>{rev.version}</span>
                <ChangeMetricsDisplay changeMetrics={rev.changeMetrics} />
                <span className={classes.editedAt}>
                  <FormatDate date={rev.editedAt} />
                </span>
              </div>
            ))}
          <div className={classes.loadMore}>
            <LoadMore {...loadMoreProps} />
          </div>
        </div>
        <div className={classes.selectedRevisionDisplay}>
          {revision && (
            <>
              {canRevert && (
                <div className={classes.titleRow}>
                  v{revision.version}
                  <ButtonComponent variant="outlined" className={classes.button} onClick={restoreVersion}>
                    Load {revision.version} into editor
                  </ButtonComponent>
                  <ButtonComponent variant="contained" className={classes.button} onClick={restoreVersion}>
                    Restore {revision.version} {revertInProgress && <Loading />}
                  </ButtonComponent>
                </div>
              )}
              {revision.commitMessage}
              {revision.draft ? "[DRAFT]" : "[NOT DRAFT]"}
              <ContentItemBody
                dangerouslySetInnerHTML={{ __html: revision.html }}
                description="PostVersionHistory revision"
              />
            </>
          )}
        </div>
      </div>
    </LWDialog>
  );
}

const PostVersionHistoryButtonComponent = registerComponent("PostVersionHistoryButton", PostVersionHistoryButton, {styles});
const PostVersionHistoryComponent = registerComponent("PostVersionHistory", PostVersionHistory, {styles});

declare global {
  interface ComponentTypes {
    PostVersionHistoryButton: typeof PostVersionHistoryButtonComponent
    PostVersionHistory: typeof PostVersionHistoryComponent
  }
}
