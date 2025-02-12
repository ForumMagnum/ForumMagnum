import React, { useState } from 'react';
import { Components, registerComponent } from '@/lib/vulcan-lib/components';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { tagHistoryStyles } from './TagHistoryPage';

const styles = defineStyles("SummaryRevisionItem", (theme: ThemeType) => ({
  container: {
  },
  username: {
  },
}));

const SummaryRevisionItem = ({tag, collapsed, revision}: {
  tag: TagBasicInfo,
  collapsed: boolean,
  revision: RevisionHistorySummaryEdit,
}) => {
  const classes = useStyles(styles);
  const tagHistoryClasses = useStyles(tagHistoryStyles);
  const { CompareRevisions, ContentStyles, ForumIcon, TagRevisionItemShortMetadata } = Components;
  const [expanded, setExpanded] = useState(false);
  const documentId = revision.documentId;

  const summary = revision.summary;
  
  function getShortDescription() {
    if (summary?.parentLens) {
      return <div>Summary of lens {summary.parentLens.tabTitle}: {`${summary.tabTitle}${summary.tabSubtitle ? ` (${summary.tabSubtitle})` : ""}`}</div>
    } else if (summary?.parentTag) {
      return <div>Summary: {`${summary.tabTitle}${summary.tabSubtitle ? ` (${summary.tabSubtitle})` : ""}`}</div>
    } else {
      return <div>(Deleted summary)</div>
    }
  }
  const shortDescription = getShortDescription();

  // TODO: There isn't a valid permalink-URL for revisions to summaries, currently.
  const url = '';

  return <Components.SingleLineFeedEvent
    icon={<ForumIcon className={tagHistoryClasses.feedIcon} icon="Edit"/>}
    frame expands setExpanded={setExpanded}
  >
    {(collapsed && !expanded) && <TagRevisionItemShortMetadata tag={tag} itemDescription={shortDescription} url={url} revision={revision} />}
    {!(collapsed && !expanded) && <ContentStyles contentType="comment">
      <div><TagRevisionItemShortMetadata tag={tag} itemDescription={shortDescription} url={url} revision={revision} /></div>
      <CompareRevisions
        trim={true}
        collectionName="MultiDocuments" fieldName="contents"
        documentId={documentId}
        versionBefore={null}
        versionAfter={revision.version}
      />
    </ContentStyles>}
  </Components.SingleLineFeedEvent>
}

const SummaryRevisionItemComponent = registerComponent('SummaryRevisionItem', SummaryRevisionItem);

declare global {
  interface ComponentTypes {
    SummaryRevisionItem: typeof SummaryRevisionItemComponent
  }
}

