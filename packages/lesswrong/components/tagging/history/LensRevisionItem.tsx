import React, { useState } from 'react';
import { Components, registerComponent } from '@/lib/vulcan-lib/components';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { TagLens } from '@/lib/arbital/useTagLenses';
import classNames from 'classnames';
import withErrorBoundary from '@/components/common/withErrorBoundary';
import { tagGetRevisionLink } from '@/lib/collections/tags/helpers';
import { tagHistoryStyles } from './TagHistoryPage';

const styles = defineStyles("LensRevisionItem", (theme: ThemeType) => ({
  contentStyle: {
  },
  container: {
  },
}));

const LensRevisionItem = ({tag, collapsed, lens, revision, noContainer = false}: {
  tag: TagBasicInfo,
  collapsed?: boolean,
  lens: MultiDocumentContentDisplay | TagLens,
  revision: RevisionHistoryEntry,
  noContainer?: boolean,
}) => {
  const classes = useStyles(styles);
  const tagHistoryClasses = useStyles(tagHistoryStyles);
  const { CompareRevisions, TagRevisionItemShortMetadata, ForumIcon, ContentStyles } = Components
  const documentId = lens._id;

  const [expanded, setExpanded] = useState(false);
  if (!documentId || !revision) return null

  const revUrl = tagGetRevisionLink(tag, revision.version, lens);
  const lensShortDescription = <div>
    Lens: {`${lens.tabTitle}${lens.tabSubtitle ? ` (${lens.tabSubtitle})` : ""}`}
  </div>

  const diffBody = <ContentStyles contentType="comment" className={classes.contentStyle}>
    <CompareRevisions
      trim={true}
      collectionName="MultiDocuments" fieldName="contents"
      documentId={documentId}
      versionBefore={null}
      versionAfter={revision.version}
    />
  </ContentStyles>

  const contents = (collapsed && !expanded)
    ? <TagRevisionItemShortMetadata tag={tag} itemDescription={lensShortDescription} url={revUrl} revision={revision} />
    : <>
        <div><TagRevisionItemShortMetadata tag={tag} itemDescription={lensShortDescription} url={revUrl} revision={revision} /></div>
        {diffBody}
      </>

  return (noContainer
    ? contents
    : <Components.SingleLineFeedEvent
        icon={<ForumIcon className={tagHistoryClasses.feedIcon} icon="Edit"/>}
        frame expands expanded={expanded || !collapsed} setExpanded={setExpanded}
        tooltip={!(expanded || !collapsed) && diffBody}
      >
        <div className={classes.container}>
          {contents}
        </div>
      </Components.SingleLineFeedEvent>
  );
}

const LensRevisionItemComponent = registerComponent('LensRevisionItem', LensRevisionItem, {
  hocs: [withErrorBoundary]
});

declare global {
  interface ComponentTypes {
    LensRevisionItem: typeof LensRevisionItemComponent
  }
}

