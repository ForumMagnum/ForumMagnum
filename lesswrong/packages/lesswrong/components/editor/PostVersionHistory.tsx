import React, {useCallback, useEffect, useState} from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { fragmentTextForQuery } from '../../lib/vulcan-lib/fragments';
import { useDialog } from '../common/withDialog';
import { useMulti } from '../../lib/crud/withMulti';
import { useSingle } from '../../lib/crud/withSingle';
import classNames from 'classnames';
import {CENTRAL_COLUMN_WIDTH} from "../posts/PostsPage/PostsPage";
import {commentBodyStyles, postBodyStyles} from "../../themes/stylePiping";
import { useMutation, gql } from '@apollo/client';
import { useTracking } from '../../lib/analyticsEvents';
import { useCurrentUser } from '../common/withUser';
import { canUserEditPostMetadata, postGetEditUrl } from '../../lib/collections/posts/helpers';
import { preferredHeadingCase } from '../../themes/forumTheme';
import { isCollaborative } from './EditorFormComponent';
import { useOnNavigate } from '../hooks/useOnNavigate';
import { useLocation, useNavigate } from "../../lib/routeUtil";
import EAButton from "@/components/ea-forum/EAButton";
import LWDialog from "@/components/common/LWDialog";
import { Loading } from "@/components/vulcan-core/Loading";
import ContentItemBody from "@/components/common/ContentItemBody";
import FormatDate from "@/components/common/FormatDate";
import LoadMore from "@/components/common/LoadMore";
import ChangeMetricsDisplay from "@/components/tagging/ChangeMetricsDisplay";
import LWTooltip from "@/components/common/LWTooltip";

const LEFT_COLUMN_WIDTH = 160

const styles = (theme: ThemeType) => ({
  root: {
    maxWidth: CENTRAL_COLUMN_WIDTH + LEFT_COLUMN_WIDTH + 64,
    display: "flex",
    padding: 24,
    justifyContent: 'space-between',
    gap: "32px"
  },
  leftColumn: {
    ...commentBodyStyles(theme),
  },
  revisionRow: {
    padding: 12,
    cursor: "pointer",
    whiteSpace: "nowrap"
  },
  selectedRevision: {
    background: theme.palette.grey[200],
  },
  liveRevision: {
    fontWeight: 700,
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
  header: {
    borderBottom: `1px solid ${theme.palette.grey[200]}`,
    marginBottom: 12
  },
  titleRow: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "16px",
    alignItems: "center",
    padding: "12px 0",
    flexWrap: "wrap"
  },
  commitMessage: {
    fontStyle: "italic",
    fontSize: 12,
    lineHeight: "16px",
    marginBottom: 6
  },
  versionHistoryButton: {
    color: theme.palette.grey[680],
    padding: '8px 12px',
    border: "none",
    '&:hover': {
      backgroundColor: theme.palette.panelBackground.darken08,
      border: "none",
    }
  },
  button: {
    whiteSpace: "nowrap"
  },
  loadMore: {
    paddingLeft: 12
  },
  versionTitle: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    marginRight: "auto",
    fontWeight: 600,
    fontSize: 20,
  },
  tooltip: {
    marginBottom: 4
  }
});

const PostVersionHistoryButton = ({post, postId, classes}: {
  post: PostsBase,
  postId: string,
  classes: ClassesType<typeof styles>
}) => {
  const { openDialog } = useDialog();
  const { captureEvent } = useTracking()
  return <EAButton
    onClick={() => {
      captureEvent("versionHistoryButtonClicked", {postId})
      openDialog({
        componentName: "PostVersionHistory",
        componentProps: {post, postId},
      })
    }}
    variant={"outlined"}
    className={classes.versionHistoryButton}
  >
    {preferredHeadingCase("Version History")}
  </EAButton>
}

const LIVE_REVISION_TOOLTIP = "This version is currently live"
const LOAD_VERSION_TOOLTIP = "Load this version into the editor (you will then need to publish it to update the live post)"
const RESTORE_VERSION_TOOLTIP = "Update the live post to use this version"

const PostVersionHistory = ({post, postId, onClose, classes}: {
  post: PostsBase,
  postId: string,
  onClose: () => void,
  classes: ClassesType<typeof styles>
}) => {
  const currentUser = useCurrentUser();
  const { captureEvent } = useTracking()
  const location = useLocation();
  const navigate = useNavigate();

  const isCollabEditor = isCollaborative(post, "contents")

  const { query } = location;
  const loadedVersion = query.version;

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
    if (!(revisions && revisions.length > 0)) return

    // If the the loaded version in behind a "Load more" this will fall back to the first revision
    const defaultRev = (loadedVersion && revisions.find((r) => r.version === loadedVersion)?._id) ?? revisions[0]._id;
    setSelectedRevisionId(defaultRev)
  }, [loadedVersion, revisions])

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
    window.location.reload();
  }, [captureEvent, postId, revertMutation, selectedRevisionId])

  const loadVersion = useCallback(async (version: string) => {
    captureEvent("loadVersionClicked", {postId, revisionId: selectedRevisionId})

    if (location.pathname.startsWith('/editPost')) {
      const queryParams = new URLSearchParams(query);
      queryParams.set('version', version);
      const newSearchString = queryParams.toString();

      navigate({ ...location.location, search: `?${newSearchString}`});
    } else {
      void navigate(postGetEditUrl(postId, false, post.linkSharingKey ?? undefined, version));
    }

    onClose();
  }, [captureEvent, location.location, location.pathname, navigate, onClose, post.linkSharingKey, postId, query, selectedRevisionId])

  useOnNavigate(() => {
    onClose();
  })

  const { document: revision, loading: revisionLoading } = useSingle({
    skip: !selectedRevisionId,
    documentId: selectedRevisionId||"",
    collectionName: "Revisions",
    fetchPolicy: "cache-first",
    fragmentName: "RevisionDisplay",
  });

  const isLive = (r: {_id: string}) => r._id === post.contents_latest

  return (
    <LWDialog open={true} maxWidth={false} onClose={onClose}>
      <div className={classes.root}>
        <div className={classes.leftColumn}>
          {revisions &&
            revisions.map((rev) => (
              <div
                key={rev._id}
                className={classNames(classes.revisionRow, {
                  [classes.selectedRevision]: rev._id === selectedRevisionId,
                })}
                onClick={() => setSelectedRevisionId(rev._id)}
              >
                <LWTooltip title={isLive(rev) ? LIVE_REVISION_TOOLTIP : undefined} placement="top" popperClassName={classes.tooltip}>
                  <span
                    className={classNames(classes.versionNumber, {
                      [classes.liveRevision]: isLive(rev),
                    })}
                  >
                    {rev.version}
                  </span>
                </LWTooltip>
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
          {revisionLoading && <Loading />}
          {revision && (
            <>
              {canRevert && (
                <div className={classes.header}>
                  <div className={classes.titleRow}>
                    <div className={classes.versionTitle}>
                      v{revision.version}
                      {isLive(revision) ? " (Live version)" : ""}
                    </div>
                    {!isCollabEditor && <LWTooltip title={LOAD_VERSION_TOOLTIP} placement="top"  popperClassName={classes.tooltip}>
                      <EAButton
                        variant="outlined"
                        className={classes.button}
                        onClick={() => loadVersion(revision.version)}
                      >
                        Load into editor
                      </EAButton>
                    </LWTooltip>}
                    <LWTooltip title={RESTORE_VERSION_TOOLTIP} placement="top" popperClassName={classes.tooltip}>
                      <EAButton variant="contained" className={classes.button} onClick={restoreVersion}>
                        {revertInProgress ? <Loading /> : "Restore"}
                      </EAButton>
                    </LWTooltip>
                  </div>
                  <div className={classes.commitMessage}>{revision.commitMessage}</div>
                </div>
              )}
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

const PostVersionHistoryEAButton = registerComponent("PostVersionHistoryButton", PostVersionHistoryButton, {styles});
const PostVersionHistoryComponent = registerComponent("PostVersionHistory", PostVersionHistory, {styles});

declare global {
  interface ComponentTypes {
    PostVersionHistoryButton: typeof PostVersionHistoryEAButton
    PostVersionHistory: typeof PostVersionHistoryComponent
  }
}

export {
  PostVersionHistoryEAButton as PostVersionHistoryButton,
  PostVersionHistoryComponent as PostVersionHistory
}
