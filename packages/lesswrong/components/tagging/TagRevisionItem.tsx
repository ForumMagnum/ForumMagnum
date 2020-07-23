import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import withErrorBoundary from '../common/withErrorBoundary'
import { commentBodyStyles } from '../../themes/stylePiping'

const styles = theme => ({
  root: {
    ...commentBodyStyles(theme),
    // '& *': {
    //   display: "none"
    // },
    '& ins': {
      display: "unset"
    },
    '& del': {
      display: "unset"
    },
  }
});

const TagRevisionItem = ({documentId, revision, classes, previousRevision}: {
  revision: RevisionMetadataWithChangeMetrics,
  previousRevision: RevisionMetadataWithChangeMetrics
  classes: ClassesType,
  documentId: string
}) => {
  const { CompareRevisions } = Components

  if (!documentId || !revision || !previousRevision) return null

  return <div className={classes.root}>
      <CompareRevisions
        collectionName="Tags" fieldName="description"
        documentId={documentId}
        versionBefore={previousRevision.version}
        versionAfter={revision.version}
      />
    </div>
}

const TagRevisionItemComponent = registerComponent("TagRevisionItem", TagRevisionItem, {styles, hocs: [withErrorBoundary]});

declare global {
  interface ComponentTypes {
    TagRevisionItem: typeof TagRevisionItemComponent
  }
}
