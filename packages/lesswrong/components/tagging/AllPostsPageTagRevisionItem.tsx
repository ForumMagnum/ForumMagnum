import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useSingle } from '../../lib/crud/withSingle';
import { isEAForum } from '../../lib/instanceSettings';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    background: theme.palette.panelBackground.commentNodeEven,
    border: theme.palette.border.commentBorder,
    borderRight: "none",
    borderRadius: isEAForum
      ? `${theme.borderRadius.default}px 0 0 ${theme.borderRadius.default}px`
      : "2px 0 0 2px",
    padding: 12,
    marginLeft: 8,
    marginBottom: 16,
  },
});

const AllPostsPageTagRevisionItem = ({tag, revisionId, documentId, classes}: {
  tag: TagBasicInfo,
  revisionId: string,
  documentId: string,
  classes: ClassesType,
}) => {
  const {Loading, CompareRevisions, TagRevisionItemShortMetadata, ContentStyles} = Components;
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
    
    {<ContentStyles contentType="comment">
      <CompareRevisions
        trim={true}
        collectionName="Tags" fieldName="description"
        documentId={documentId}
        versionBefore={null}
        versionAfter={revision.version}
      />
    </ContentStyles>}
  </div>
}

const AllPostsPageTagRevisionItemComponent = registerComponent("AllPostsPageTagRevisionItem", AllPostsPageTagRevisionItem, {styles});

declare global {
  interface ComponentTypes {
    AllPostsPageTagRevisionItem: typeof AllPostsPageTagRevisionItemComponent
  }
}

