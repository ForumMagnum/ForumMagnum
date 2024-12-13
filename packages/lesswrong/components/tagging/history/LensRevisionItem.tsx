import React, { useState } from 'react';
import { Components, registerComponent } from '@/lib/vulcan-lib/components';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { TagLens } from '@/lib/arbital/useTagLenses';
import classNames from 'classnames';
import withErrorBoundary from '@/components/common/withErrorBoundary';

const styles = defineStyles("LensRevisionItem", (theme: ThemeType) => ({
  container: {
    background: theme.palette.panelBackground.default,
    border: theme.palette.border.commentBorder,
    padding: '4px 12px 12px 12px',
    borderRadius:3,
    marginBottom: 16,
  },
  contentStyle: {
    marginTop: 0,
  }
}));

const LensRevisionItem = ({tag, collapsed, lens, revision, noContainer = false}: {
  tag: TagBasicInfo,
  collapsed?: boolean,
  lens: MultiDocumentContentDisplay | TagLens,
  revision: RevisionHistoryEntry,
  noContainer?: boolean,
}) => {
  const classes = useStyles(styles);
  const { CompareRevisions, TagRevisionItemShortMetadata, ContentStyles } = Components
  const documentId = lens._id;

  const [expanded, setExpanded] = useState(false);
  if (!documentId || !revision) return null
  const { added, removed } = revision.changeMetrics;

  if (collapsed && !expanded) {
    return <Components.SingleLineFeedEvent expands setExpanded={setExpanded}>
      <TagRevisionItemShortMetadata tag={tag} revision={revision} />
    </Components.SingleLineFeedEvent>
  }

  return <div className={classNames(!noContainer && classes.container)}>
    <ContentStyles contentType="comment" className={classes.contentStyle}>
      <div><TagRevisionItemShortMetadata tag={tag} revision={revision} lens={lens} /></div>
      <CompareRevisions
        trim={true}
        collectionName="MultiDocuments" fieldName="contents"
        documentId={documentId}
        versionBefore={null}
        versionAfter={revision.version}
      />
    </ContentStyles>
  </div>
}

const LensRevisionItemComponent = registerComponent('LensRevisionItem', LensRevisionItem, {
  hocs: [withErrorBoundary]
});

declare global {
  interface ComponentTypes {
    LensRevisionItem: typeof LensRevisionItemComponent
  }
}

