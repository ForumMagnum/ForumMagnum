import React, { useState } from 'react';
import { Components, registerComponent } from '@/lib/vulcan-lib/components';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { tagHistoryStyles } from './TagHistoryPage';

const styles = defineStyles("SummaryRevisionItem", (theme: ThemeType) => ({
  container: {
    /*background: theme.palette.panelBackground.default,
    border: theme.palette.border.commentBorder,
    padding: '4px 12px 12px 12px',
    borderRadius:3,
    marginBottom: 16,*/
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
  const shortDescription = summary
    ? <div>Summary: {`${summary.tabTitle}${summary.tabSubtitle ? ` (${summary.tabSubtitle})` : ""}`}</div>
    : <div>(Deleted summary)</div>

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

