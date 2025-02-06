import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useSingle } from '../../lib/crud/withSingle';

const TagRevisionItemWrapper = ({tag, headingStyle, revisionId, documentId}: {
  tag: TagBasicInfo,
  headingStyle: "full"|"abridged",
  revisionId: string,
  documentId: string,
}) => {
  const {TagRevisionItem} = Components;
  const {document, loading} = useSingle({
    documentId: revisionId,
    collectionName: "Revisions",
    fragmentName: "RevisionHistoryEntry",
    fetchPolicy: 'cache-then-network' as any, //TODO
  });
  
  if (loading) return null;
  if (!document) {return null;}
  return <TagRevisionItem tag={tag} headingStyle={headingStyle} revision={document} documentId={documentId}/>
}

const TagRevisionItemWrapperComponent = registerComponent("TagRevisionItemWrapper", TagRevisionItemWrapper);

declare global {
  interface ComponentTypes {
    TagRevisionItemWrapper: typeof TagRevisionItemWrapperComponent
  }
}
