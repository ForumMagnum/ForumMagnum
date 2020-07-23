import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';

const styles = theme => ({
});

const TagRevisionItem = ({revision, classes}: {
  revision: RevisionMetadataWithChangeMetrics,
  classes: ClassesType,
}) => {
  const { CompareRevisions } = Components
  console.log(revision)
  return <CompareRevisions
    collectionName="Tags" fieldName="description"
    documentId={tag._id}
    versionBefore={versionBefore}
    versionAfter={versionAfter}
  />
}

const TagRevisionItemComponent = registerComponent("TagRevisionItem", TagRevisionItem, {styles});

declare global {
  interface ComponentTypes {
    TagRevisionItem: typeof TagRevisionItemComponent
  }
}
