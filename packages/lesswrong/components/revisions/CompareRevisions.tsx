import React, { useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useQuery, gql, useMutation } from '@apollo/client';
import { defineStyles, useStyles } from '../hooks/useStyles';
import Menu from '@material-ui/core/Menu';
import { useUpdate } from '@/lib/crud/withUpdate';
import { userIsAdminOrMod } from '@/lib/vulcan-users';
import { useCurrentUser } from '../common/withUser';

const styles = defineStyles("CompareRevisions", (theme: ThemeType) => ({
  differences: {
    "& ins": {
      background: theme.palette.background.diffInserted,
      textDecoration: "none",
    },
    "& del": {
      background: theme.palette.background.diffDeleted,
      textDecoration: "none",
    },
  },
  expand: {
    cursor: "pointer",
    color: theme.palette.primary.main,
    marginTop: 12
  },
  menuButton: {
    position: "absolute",
    top: 12,
    right: 12,
    cursor: "pointer"
  },
  menuIcon: {
    "--icon-size": "15.6px",
    color: theme.palette.icon.dim,
  },
}));

const CompareRevisions = ({
  collectionName,
  fieldName,
  documentId,
  versionBefore,
  versionAfter,
  revisionAfter,
  trim=false
}: {
  collectionName: string,
  fieldName: string,
  documentId: string,
  versionBefore: string|null,
  versionAfter: string,
  revisionAfter: RevisionHistoryEntry,
  trim?: boolean
}) => {
  const classes = useStyles(styles);
  const [expanded, setExpanded] = useState(false);
  const currentUser = useCurrentUser();

  const { ErrorMessage, Loading, ContentItemTruncated } = Components;
  
  // Use the RevisionsDiff resolver to get a comparison between revisions (see
  // packages/lesswrong/server/resolvers/diffResolvers.ts).
  const { data: diffResult, loading: loadingDiff, error } = useQuery(gql`
    query RevisionsDiff($collectionName: String!, $fieldName: String!, $id: String!, $beforeRev: String, $afterRev: String!, $trim: Boolean) {
      RevisionsDiff(collectionName: $collectionName, fieldName: $fieldName, id: $id, beforeRev: $beforeRev, afterRev: $afterRev, trim: $trim)
    }
  `, {
    variables: {
      collectionName: collectionName,
      fieldName: fieldName,
      id: documentId,
      beforeRev: versionBefore,
      afterRev: versionAfter,
      trim: trim
    },
    ssr: true,
  });

  const diffResultHtml = diffResult?.RevisionsDiff;

  if (error) {
    return <ErrorMessage message={error.message}/>
  }
  
  if (loadingDiff)
    return <Loading/>
  
  const wordCount = diffResultHtml.split(" ").length

  return (
    <div className={classes.differences}>
      <ContentItemTruncated
        maxLengthWords={600}
        rawWordCount={wordCount}
        graceWords={20}
        expanded={expanded}
        getTruncatedSuffix={({wordsLeft}: {wordsLeft: number|null}) =>
          <div className={classes.expand} onClick={() => setExpanded(true)}>
            {wordsLeft && <>Read More ({wordsLeft} more words)</>}
            {!wordsLeft && <>Read More</>}
          </div>
        }
        dangerouslySetInnerHTML={{__html: diffResultHtml}}
        description={`tag ${documentId}`}
      />
      {userIsAdminOrMod(currentUser) && <CompareRevisionsMenu revision={revisionAfter} />}
    </div>
  );
}

const CompareRevisionsMenu = ({revision}: {
  revision: RevisionHistoryEntry
}) => {
  const { ForumIcon } = Components;
  const classes = useStyles(styles);
  const [anchorEl, setAnchorEl] = useState<any>(null);
  const [everOpened, setEverOpened] = useState(false);
  
  return <>
    <span
      className={classes.menuButton}
      onClick={ev => {
        setAnchorEl(ev.currentTarget);
        setEverOpened(true)
      }}
    >
      <ForumIcon className={classes.menuIcon} icon="EllipsisVertical"/>
    </span>
    <Menu
      onClick={() => {
        setAnchorEl(null);
      }}
      open={!!anchorEl}
      anchorEl={anchorEl}
    >
      {everOpened && <>
        <RevisionsMenuActions revision={revision}/>
      </>}
    </Menu>
  </>
}

const RevisionsMenuActions = ({revision}: {
  revision: RevisionHistoryEntry
}) => {
  const { MenuItem } = Components;

  const {mutate: updateRevision} = useUpdate({
    collectionName: "Revisions",
    fragmentName: "RevisionEdit",
  });

  return <>
    <MenuItem onClick={ev => {
      void updateRevision({
        selector: {_id: revision._id},
        data: {
          skipAttributions: !revision.skipAttributions,
        },
      });
    }}>
      {revision.skipAttributions
        ? "Don't exclude this revision from attributions"
        : "Exclude this revision from attributions"
      }
    </MenuItem>
  </>
}


const CompareRevisionsComponent = registerComponent("CompareRevisions", CompareRevisions);

declare global {
  interface ComponentTypes {
    CompareRevisions: typeof CompareRevisionsComponent
  }
}
