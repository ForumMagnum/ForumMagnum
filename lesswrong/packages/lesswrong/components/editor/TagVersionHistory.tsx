import React, {useEffect, useState} from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
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
import { tagUserHasSufficientKarma } from '../../lib/collections/tags/helpers';
import { preferredHeadingCase } from '../../themes/forumTheme';
import LWDialog from "@/components/common/LWDialog";
import { Loading } from "@/components/vulcan-core/Loading";
import ContentItemBody from "@/components/common/ContentItemBody";
import FormatDate from "@/components/common/FormatDate";
import LoadMore from "@/components/common/LoadMore";
import ChangeMetricsDisplay from "@/components/tagging/ChangeMetricsDisplay";

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
  restoreButton: {
    textAlign: "center",
    marginBottom: 32,
    marginTop: 16,
    paddingRight: 100
  },
  loadMore: {
    paddingLeft: 12
  }
});

const TagVersionHistoryButton = ({tagId, classes}: {
  tagId: string,
  classes: ClassesType<typeof styles>
}) => {
  const { openDialog } = useDialog();
  const { captureEvent } = useTracking()

  return <Button
    onClick={() => {
      captureEvent("tagVersionHistoryButtonClicked", {tagId})
      openDialog({
        componentName: "TagVersionHistory",
        componentProps: {
          tagId
        },
      })
    }}
  >
    {preferredHeadingCase('Revert To Previous Version')}
  </Button>
}

const TagVersionHistory = ({tagId, onClose, classes}: {
  tagId: string,
  onClose: () => void,
  classes: ClassesType<typeof styles>
}) => {
  const currentUser = useCurrentUser();
  const [selectedRevisionId,setSelectedRevisionId] = useState<string|null>(null);
  const [revertInProgress,setRevertInProgress] = useState(false);
  // We need the $contributorsLimit arg to satisfy the fragment, other graphql complains, even though we don't use any results that come back.
  const [revertMutation] = useMutation(gql`
    mutation revertToRevision($tagId: String!, $revertToRevisionId: String!, $contributorsLimit: Int) {
      revertTagToRevision(tagId: $tagId, revertToRevisionId: $revertToRevisionId) {
        ...TagPageFragment
      }
    }
    ${fragmentTextForQuery("TagPageFragment")}
  `, {
    ignoreResults: true
  });
  const [revertLoading, setRevertLoading] = useState(false);
  const canRevert = tagUserHasSufficientKarma(currentUser, 'edit');
  
  const { results: revisions, loading: loadingRevisions, loadMoreProps } = useMulti({
    terms: {
      view: "revisionsOnDocument",
      documentId: tagId,
      fieldName: "description",
    },
    fetchPolicy: "cache-and-network",
    collectionName: "Revisions",
    fragmentName: "RevisionMetadataWithChangeMetrics",
  });
  
  useEffect(() => {
    revisions && revisions.length > 0 && setSelectedRevisionId(revisions[0]._id)
  }, [revisions])
  
  const { document: revision } = useSingle({
    skip: !selectedRevisionId,
    documentId: selectedRevisionId||"",
    collectionName: "Revisions",
    fetchPolicy: "cache-first",
    fragmentName: "RevisionDisplay",
  });

  const { captureEvent } = useTracking()
  
  return <LWDialog open={true} maxWidth={false} onClose={onClose}>
    <div className={classes.root}>
      <div className={classes.leftColumn}>
        {loadingRevisions && <Loading/>}
        {revisions && revisions.map(rev =>
          <div key={rev._id}
            className={classNames(classes.revisionRow, {
              [classes.selectedRevision]: rev._id===selectedRevisionId,
            })}
            onClick={() => setSelectedRevisionId(rev._id)}
          >
            <span className={classes.versionNumber}>{rev.version}</span>
            <ChangeMetricsDisplay changeMetrics={rev.changeMetrics}/>
            <span className={classes.editedAt}><FormatDate date={rev.editedAt}/></span>
          </div>
        )}
        <div className={classes.loadMore}>
          <LoadMore {...loadMoreProps}/>
        </div>
      </div>
      <div className={classes.selectedRevisionDisplay}>
        {revision && canRevert && <div className={classes.restoreButton}>
          {revertLoading
            ? <Loading/>
            : <Button variant="contained" color="primary" onClick={async () => {
                captureEvent("restoreTagVersionClicked", {tagId, revisionId: selectedRevisionId})
                setRevertInProgress(true);
                await revertMutation({
                  variables: {
                    tagId: tagId,
                    revertToRevisionId: selectedRevisionId,
                  },
                });
                // Hard-refresh the page to get things back in sync
                location.reload();
              }}
            >
              RESTORE THIS VERSION{" "}
              {revertInProgress && <Loading/>}
            </Button>
          }
        </div>}
        {revision && <ContentItemBody
          dangerouslySetInnerHTML={{__html: revision.html}}
          description="TagVersionHistory revision"
        />}
      </div>
    </div>
  </LWDialog>
}

const TagVersionHistoryButtonComponent = registerComponent("TagVersionHistoryButton", TagVersionHistoryButton, {styles});
const TagVersionHistoryComponent = registerComponent("TagVersionHistory", TagVersionHistory, {styles});

declare global {
  interface ComponentTypes {
    TagVersionHistoryButton: typeof TagVersionHistoryButtonComponent
    TagVersionHistory: typeof TagVersionHistoryComponent
  }
}

export {
  TagVersionHistoryButtonComponent as TagVersionHistoryButton,
  TagVersionHistoryComponent as TagVersionHistory
}
