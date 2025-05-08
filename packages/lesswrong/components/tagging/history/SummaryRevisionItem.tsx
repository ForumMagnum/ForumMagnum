import React, { useState } from 'react';
import { registerComponent } from '@/lib/vulcan-lib/components';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { tagHistoryStyles } from './TagHistoryPage';
import { SingleLineFeedEvent } from "../../common/SingleLineFeedEvent";
import { CompareRevisions } from "../../revisions/CompareRevisions";
import { ContentStyles } from "../../common/ContentStyles";
import { ForumIcon } from "../../common/ForumIcon";
import { TagRevisionItemShortMetadata } from "../TagRevisionItemShortMetadata";

const styles = defineStyles("SummaryRevisionItem", (theme: ThemeType) => ({
  container: {
  },
  username: {
  },
}));

const SummaryRevisionItemInner = ({tag, collapsed, revision}: {
  tag: TagBasicInfo,
  collapsed: boolean,
  revision: RevisionHistorySummaryEdit,
}) => {
  const classes = useStyles(styles);
  const tagHistoryClasses = useStyles(tagHistoryStyles);
  const [expanded, setExpanded] = useState(false);
  const documentId = revision.documentId ?? '';

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

  const diffBody = <ContentStyles contentType="comment">
    <CompareRevisions
      trim={true}
      collectionName="MultiDocuments" fieldName="contents"
      documentId={documentId}
      versionBefore={null}
      versionAfter={revision.version}
      revisionAfter={revision}
    />
  </ContentStyles>

  return <SingleLineFeedEvent
    icon={<ForumIcon className={tagHistoryClasses.feedIcon} icon="Edit"/>}
    frame expands expanded={expanded || !collapsed} setExpanded={setExpanded}
    tooltip={(collapsed && !expanded) && diffBody}
  >
    {(collapsed && !expanded) && <TagRevisionItemShortMetadata tag={tag} itemDescription={shortDescription} url={url} revision={revision} />}
    {!(collapsed && !expanded) && <>
      <div><TagRevisionItemShortMetadata tag={tag} itemDescription={shortDescription} url={url} revision={revision} /></div>
      {diffBody}
    </>}
  </SingleLineFeedEvent>
}

export const SummaryRevisionItem = registerComponent('SummaryRevisionItem', SummaryRevisionItemInner);

declare global {
  interface ComponentTypes {
    SummaryRevisionItem: typeof SummaryRevisionItem
  }
}

