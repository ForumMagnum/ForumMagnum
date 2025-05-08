import React from 'react';
import { isEAForum } from "../../lib/instanceSettings"
import { registerComponent } from "../../lib/vulcan-lib/components"
import { defineStyles, useStyles } from '../hooks/useStyles';
import { isFriendlyUI } from '@/themes/forumTheme';
import { TagRevisionItem } from "../tagging/TagRevisionItem";

const styles = defineStyles("RecentDiscussionTagRevisionItem", (theme) => ({
  root: {
    backgroundColor: theme.palette.panelBackground.recentDiscussionThread,
    marginBottom: isFriendlyUI ? theme.spacing.unit*2 : theme.spacing.unit*4,
    position: "relative",
    boxShadow: theme.palette.boxShadow.default,
    borderRadius: theme.borderRadius[isFriendlyUI ? "default" : "small"],

    paddingLeft: 16,
    paddingRight: 16,
    paddingTop: 18,
    paddingBottom: 12,
    [theme.breakpoints.down('xs')]: {
      paddingTop: 16,
      paddingLeft: 14,
      paddingRight: 14,
    },
  },
}));

// Pablo, Leo, Lizka
const megaTagUsers = ['BkbwT5TzSj4aRxJMN', 'pkJTc4xXhsCbNqkZM', 'SuPnfB9qqKWsucNzm']
const onlyStyleEditors = ['pkJTc4xXhsCbNqkZM']

/**
 * This component's only job is to filter out tag edits that shouldn't be shown.
 * Otherwise it's just a wrapper around TagRevisionItem.
 */
function RecentDiscussionTagRevisionItemInner({
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
  const classes = useStyles(styles);
  if (tag.adminOnly) {
    return null
  }
  
  // reduce the amount of room the EA frontpage gives to the most particularly
  // active tag users doing routine cleanup
  if (
    // Only a problem for the forum
    isEAForum &&
    // Only restrict the most active tag users
    megaTagUsers.includes(revision.userId ?? '') &&
    // Restrict all from cleanup-only users, restrict small edits from other mega users
    (onlyStyleEditors.includes(revision.userId ?? '') || revision.changeMetrics.added < 600)
  ) {
    return null
  }
  return <div className={classes.root}>
    <TagRevisionItem
      noContainer
      tag={tag}
      collapsed={collapsed}
      headingStyle={headingStyle}
      revision={revision}
      documentId={documentId}
    />
  </div>
}

export const RecentDiscussionTagRevisionItem = registerComponent(
  'RecentDiscussionTagRevisionItem', RecentDiscussionTagRevisionItemInner
)

declare global {
  interface ComponentTypes {
    RecentDiscussionTagRevisionItem: typeof RecentDiscussionTagRevisionItem,
  }
}
