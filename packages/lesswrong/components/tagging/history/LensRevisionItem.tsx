import React, { useState } from 'react';
import { Components, registerComponent } from '@/lib/vulcan-lib/components';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { TagLens } from '../TagPage';
import classNames from 'classnames';

const styles = defineStyles("LensRevisionItem", (theme: ThemeType) => ({
  container: {
    background: theme.palette.panelBackground.default,
    border: theme.palette.border.commentBorder,
    padding: 12,
    borderRadius:3,
    marginBottom: 16,
  },
}));

const LensRevisionItem = ({tag, collapsed, lens, revision}: {
  tag: TagBasicInfo,
  collapsed?: boolean,
  lens: TagLens,
  revision: RevisionHistoryEntry,
}) => {
  const classes = useStyles(styles);
  const { CompareRevisions, TagRevisionItemFullMetadata, TagRevisionItemShortMetadata, TagDiscussionButton, ContentStyles } = Components
  const documentId = lens._id;

  const [expanded, setExpanded] = useState(false);
  if (!documentId || !revision) return null
  const { added, removed } = revision.changeMetrics;

  if (collapsed && !expanded) {
    return <Components.SingleLineFeedEvent expands setExpanded={setExpanded}>
      <TagRevisionItemShortMetadata tag={tag} revision={revision} />
    </Components.SingleLineFeedEvent>
  }

  return <div className={classes.container}>
    <div><TagRevisionItemShortMetadata tag={tag} revision={revision} lens={lens} /></div>

    <ContentStyles contentType="comment">
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

const LensRevisionItemComponent = registerComponent('LensRevisionItem', LensRevisionItem);

declare global {
  interface ComponentTypes {
    LensRevisionItem: typeof LensRevisionItemComponent
  }
}

