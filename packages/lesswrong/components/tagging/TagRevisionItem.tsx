import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import withErrorBoundary from '../common/withErrorBoundary'
import { commentBodyStyles } from '../../themes/stylePiping'

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    background: "white",
    border: `solid 1px ${theme.palette.commentBorderGrey}`,
    padding: 12,
    borderRadius:3,
    marginBottom: 16,
  },
  textBody: {
    ...commentBodyStyles(theme),
  },
});

const TagRevisionItem = ({tag, headingStyle, revision, previousRevision, documentId, classes}: {
  tag: TagBasicInfo,
  headingStyle: "full"|"abridged",
  revision: RevisionMetadataWithChangeMetrics,
  previousRevision?: RevisionMetadataWithChangeMetrics
  documentId: string,
  classes: ClassesType,
}) => {
  const { CompareRevisions, TagRevisionItemFullMetadata, TagRevisionItemShortMetadata } = Components
  if (!documentId || !revision) return null
  const { added, removed } = revision.changeMetrics;

  return <div className={classes.root}>
    {headingStyle==="full" &&
      <TagRevisionItemFullMetadata tag={tag} revision={revision} />}
    {headingStyle==="abridged" &&
      <TagRevisionItemShortMetadata tag={tag} revision={revision} />}
    
    {!!(added || removed || !previousRevision) && <div className={classes.textBody}>
      <CompareRevisions
        trim={true}
        collectionName="Tags" fieldName="description"
        documentId={documentId}
        versionBefore={previousRevision?.version||null}
        versionAfter={revision.version}
      />
    </div>}
  </div>
}

const TagRevisionItemComponent = registerComponent("TagRevisionItem", TagRevisionItem, {styles, hocs: [withErrorBoundary]});

declare global {
  interface ComponentTypes {
    TagRevisionItem: typeof TagRevisionItemComponent
  }
}
