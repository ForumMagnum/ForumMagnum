import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useQuery } from '../../lib/crud/useQuery';

const styles = (theme: ThemeType): JssStyles => ({
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
  classes: ClassesType,
  trim?: boolean
}) => {
  const { ContentItemBody, ErrorMessage, Loading } = Components;
  
  // Use the RevisionsDiff resolver to get a comparison between revisions (see
  // packages/lesswrong/server/resolvers/diffResolvers.ts).
  const { data: diffResult, loading: loadingDiff, error } = useQuery("RevisionsDiff", {
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
  
  if (error) {
    return <ErrorMessage message={error.message}/>
  }
  
  if (loadingDiff)
    return <Loading/>
  
  const diffResultHtml = diffResult?.RevisionsDiff || "";
  return (
    <div className={classes.differences}>
      <ContentItemBody dangerouslySetInnerHTML={{__html: diffResultHtml}}/>
    </div>
  );
}


const CompareRevisionsComponent = registerComponent("CompareRevisions", CompareRevisions, {styles});

declare global {
  interface ComponentTypes {
    CompareRevisions: typeof CompareRevisionsComponent
  }
}
