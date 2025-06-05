import React, {useCallback, useEffect, useState} from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useDialog } from '../common/withDialog';
import classNames from 'classnames';
import { CENTRAL_COLUMN_WIDTH } from '../posts/PostsPage/constants';
import {commentBodyStyles, postBodyStyles} from "../../themes/stylePiping";
import { useMutation, useQuery } from '@apollo/client';
import { useTracking } from '../../lib/analyticsEvents';
import { useCurrentUser } from '../common/withUser';
import { canUserEditPostMetadata, postGetEditUrl } from '../../lib/collections/posts/helpers';
import { preferredHeadingCase } from '../../themes/forumTheme';
import { isCollaborative } from './EditorFormComponent';
import { useOnNavigate } from '../hooks/useOnNavigate';
import { useLocation, useNavigate } from "../../lib/routeUtil";
import { gql } from "@/lib/generated/gql-codegen/gql";
import EAButton from "../ea-forum/EAButton";
import LWDialog from "../common/LWDialog";
import Loading from "../vulcan-core/Loading";
import { ContentItemBody } from "../contents/ContentItemBody";
import FormatDate from "../common/FormatDate";
import LoadMore from "../common/LoadMore";
import ChangeMetricsDisplay from "../tagging/ChangeMetricsDisplay";
import LWTooltip from "../common/LWTooltip";
import { useQueryWithLoadMore } from "@/components/hooks/useQueryWithLoadMore";

const RevisionMetadataWithChangeMetricsMultiQuery = gql(`
  query multiRevisionPostVersionHistoryQuery($selector: RevisionSelector, $limit: Int, $enableTotal: Boolean) {
    revisions(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...RevisionMetadataWithChangeMetrics
      }
      totalCount
    }
  }
`);


const RevisionDisplayQuery = gql(`
  query PostVersionHistory($documentId: String) {
    revision(input: { selector: { documentId: $documentId } }) {
      result {
        ...RevisionDisplay
      }
    }
  }
`);

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
        name: "PostVersionHistory",
        contents: ({onClose}) => <PostVersionHistory
          onClose={onClose}
          post={post}
          postId={postId}
          classes={classes}
        />
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

  const [revertMutation] = useMutation(gql(`
    mutation revertPostToRevision($postId: String!, $revisionId: String!) {
      revertPostToRevision(postId: $postId, revisionId: $revisionId) {
        ...PostsEdit
      }
    }
  `));
  const canRevert = canUserEditPostMetadata(currentUser, post);

  const { data, loadMoreProps } = useQueryWithLoadMore(RevisionMetadataWithChangeMetricsMultiQuery, {
    variables: {
      selector: { revisionsOnDocument: { documentId: postId, fieldName: "contents" } },
      limit: 10,
      enableTotal: false,
    },
    fetchPolicy: "cache-and-network" as any,
  });

  const revisions = data?.revisions?.results;

  useEffect(() => {
    if (!(revisions && revisions.length > 0)) return

    // If the the loaded version in behind a "Load more" this will fall back to the first revision
    const defaultRev = (loadedVersion && revisions.find((r) => r.version === loadedVersion)?._id) ?? revisions[0]._id;
    setSelectedRevisionId(defaultRev)
  }, [loadedVersion, revisions])

  const restoreVersion = useCallback(async () => {
    if (!selectedRevisionId) {
      return;
    }
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

  const { loading: revisionLoading, data: dataRevisionDisplayQuery } = useQuery(RevisionDisplayQuery, {
    variables: { documentId: selectedRevisionId||"" },
    skip: !selectedRevisionId,
    fetchPolicy: "cache-first",
  });
  const revision = dataRevisionDisplayQuery?.revision?.result;

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
                dangerouslySetInnerHTML={{ __html: revision.html ?? '' }}
                description="PostVersionHistory revision"
              />
            </>
          )}
        </div>
      </div>
    </LWDialog>
  );
}

export default registerComponent("PostVersionHistoryButton", PostVersionHistoryButton, {styles});


