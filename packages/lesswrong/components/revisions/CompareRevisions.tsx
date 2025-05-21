import React, { useState } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useQuery, gql as graphql, useMutation } from '@apollo/client';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { Menu } from '@/components/widgets/Menu';
import { userIsAdminOrMod } from '@/lib/vulcan-users/permissions.ts';
import { useCurrentUser } from '../common/withUser';
import ErrorMessage from "../common/ErrorMessage";
import Loading from "../vulcan-core/Loading";
import ContentItemTruncated from "../common/ContentItemTruncated";
import ForumIcon from "../common/ForumIcon";
import { MenuItem } from "../common/Menus";
import { gql } from "@/lib/generated/gql-codegen/gql";

const RevisionEditUpdateMutation = gql(`
  mutation updateRevisionCompareRevisions($selector: SelectorInput!, $data: UpdateRevisionDataInput!) {
    updateRevision(selector: $selector, data: $data) {
      data {
        ...RevisionEdit
      }
    }
  }
`);

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
  // Use the RevisionsDiff resolver to get a comparison between revisions (see
  // packages/lesswrong/server/resolvers/diffResolvers.ts).
  const { data: diffResult, loading: loadingDiff, error } = useQuery(graphql`
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
  const [updateRevision] = useMutation(RevisionEditUpdateMutation);

  return <>
    <MenuItem onClick={ev => {
      void updateRevision({
        variables: {
          selector: { _id: revision._id },
          data: {
            skipAttributions: !revision.skipAttributions,
          }
        }
      });
    }}>
      {revision.skipAttributions
        ? "Don't exclude this revision from attributions"
        : "Exclude this revision from attributions"
      }
    </MenuItem>
  </>
}


export default registerComponent("CompareRevisions", CompareRevisions);


