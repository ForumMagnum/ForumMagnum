import React from 'react';
import { isEAForum } from "../../lib/instanceSettings"
import { Components, registerComponent } from "../../lib/vulcan-lib"

// Pablo, Leo, Lizka
const megaTagUsers = ['BkbwT5TzSj4aRxJMN', 'pkJTc4xXhsCbNqkZM', 'SuPnfB9qqKWsucNzm']
const onlyStyleEditors = ['pkJTc4xXhsCbNqkZM']

/**
 * This component's only job is to filter out tag edits that shouldn't be shown.
 * Otherwise it's just a wrapper around TagRevisionItem.
 */
function RecentDiscussionTagRevisionItem({
  tag,
  collapsed=false,
  headingStyle,
  revision,
  documentId,
}: {
  tag: TagBasicInfo,
  collapsed?: boolean,
  headingStyle: "full"|"abridged",
  revision: RevisionHistoryEntry,
  documentId: string,
}) {
  const { TagRevisionItem } = Components
  
  if (tag.adminOnly) {
    return null
  }
  
  // reduce the amount of room the EA frontpage gives to the most particularly
  // active tag users doing routine cleanup
  if (
    // Only a problem for the forum
    isEAForum &&
    // Only restrict the most active tag users
    megaTagUsers.includes(revision.userId) &&
    // Restrict all from cleanup-only users, restrict small edits from other mega users
    (onlyStyleEditors.includes(revision.userId) || revision.changeMetrics.added < 600)
  ) {
    return null
  }
  return <TagRevisionItem
    tag={tag}
    collapsed={collapsed}
    headingStyle={headingStyle}
    revision={revision}
    documentId={documentId}
  />
}

const RecentDiscussionTagRevisionItemComponent = registerComponent(
  'RecentDiscussionTagRevisionItem', RecentDiscussionTagRevisionItem
)

declare global {
  interface ComponentTypes {
    RecentDiscussionTagRevisionItem: typeof RecentDiscussionTagRevisionItemComponent,
  }
}
