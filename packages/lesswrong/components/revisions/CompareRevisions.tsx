import React, { useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useQuery, gql } from '@apollo/client';

const styles = (theme: ThemeType) => ({
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
  }
});

const CompareRevisions = ({
  collectionName,
  fieldName,
  documentId,
  versionBefore,
  versionAfter,
  classes,
  trim=false
}: {
  collectionName: string,
  fieldName: string,
  documentId: string,
  versionBefore: string|null,
  versionAfter: string,
  classes: ClassesType<typeof styles>,
  trim?: boolean
}) => {
  const [expanded, setExpanded] = useState(false);

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
        getTruncatedSuffix={({wordsLeft}: {wordsLeft: number}) =>
          <div className={classes.expand} onClick={() => setExpanded(true)}>
            Read More ({wordsLeft} more words)
          </div>
        }
        dangerouslySetInnerHTML={{__html: diffResultHtml}}
        description={`tag ${documentId}`}
      />
    </div>
  );
}


const CompareRevisionsComponent = registerComponent("CompareRevisions", CompareRevisions, {styles});

declare global {
  interface ComponentTypes {
    CompareRevisions: typeof CompareRevisionsComponent
  }
}
