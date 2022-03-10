import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useSingle } from '../../lib/crud/withSingle';
import { commentBodyStyles } from '../../themes/stylePiping'

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    background: theme.palette.panelBackground.commentNodeEven,
    border: theme.palette.border.commentBorder,
    borderRight: "none",
    borderRadius: "2px 0 0 2px",
    padding: 12,
    marginLeft: 8,
    marginBottom: 16,
  },
  textBody: {
    ...commentBodyStyles(theme),
  },
});

const AllPostsPageTagRevisionItem = ({tag, revisionId, documentId, classes}: {
  tag: TagBasicInfo,
  revisionId: string,
  documentId: string,
  classes: ClassesType,
}) => {
  const {Loading, CompareRevisions, TagRevisionItemShortMetadata} = Components;
  const {document: revision, loading} = useSingle({
    documentId: revisionId,
    collectionName: "Revisions",
    fragmentName: "RevisionMetadataWithChangeMetrics",
    fetchPolicy: 'cache-then-network' as any, //TODO
  });
  
  if (loading)
    return <Loading/>
  
  if (!revision) {return null;}
  
  return <div className={classes.root}>
    <div><TagRevisionItemShortMetadata tag={tag} revision={revision}/></div>
    
    {<div className={classes.textBody}>
      <CompareRevisions
        trim={true}
        collectionName="Tags" fieldName="description"
        documentId={documentId}
        versionBefore={null}
        versionAfter={revision.version}
      />
    </div>}
  </div>
}

const AllPostsPageTagRevisionItemComponent = registerComponent("AllPostsPageTagRevisionItem", AllPostsPageTagRevisionItem, {styles});

declare global {
  interface ComponentTypes {
    AllPostsPageTagRevisionItem: typeof AllPostsPageTagRevisionItemComponent
  }
}

