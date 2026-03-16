import React from 'react';
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen";
import Loading from "../vulcan-core/Loading";
import TagRevisionItem from "./TagRevisionItem";
import LensRevisionItem from "./history/LensRevisionItem";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const RevisionHistoryEntryQuery = gql(`
  query AllPostsPageTagRevisionItem($documentId: String) {
    revision(input: { selector: { documentId: $documentId } }) {
      result {
        ...RevisionHistoryEntry
      }
    }
  }
`);

const styles = defineStyles("AllPostsPageTagRevisionItem", (theme: ThemeType) => ({
  root: {
    background: theme.palette.panelBackground.commentNodeEven,
    border: theme.palette.border.commentBorder,
    borderRight: "none",
    borderRadius: theme.isFriendlyUI
      ? `${theme.borderRadius.default}px 0 0 ${theme.borderRadius.default}px`
      : "2px 0 0 2px",
    padding: 12,
    marginLeft: 8,
    marginBottom: 16,
  },
}));

const AllPostsPageTagRevisionItem = ({tag, revisionId, documentId}: {
  tag: TagHistoryFragment,
  revisionId: string,
  documentId: string,
}) => {
  const classes = useStyles(styles);
  const { loading, data } = useQuery(RevisionHistoryEntryQuery, {
    variables: { documentId: revisionId },
    fetchPolicy: 'cache-first',
  });
  const revision = data?.revision?.result;
  
  if (loading)
    return <Loading/>
  
  if (!revision) {return null;}

  if (revision.collectionName === 'Tags') {
    return <div className={classes.root}>
      <TagRevisionItem tag={tag} revision={revision} documentId={documentId} headingStyle="abridged" noContainer={true} />
    </div>
  } else {
    const lens = tag.lensesIncludingDeleted.find(l => l._id === revision.documentId);
    // This shouldn't ever actually happen
    if (!lens) {
      return null;
    } else {
      return <div className={classes.root}>
        <LensRevisionItem tag={tag} lens={lens} revision={revision} noContainer={true} />
      </div>
    }
  }
}

export default AllPostsPageTagRevisionItem



