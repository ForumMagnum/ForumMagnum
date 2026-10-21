import React from 'react';
import { defineStyles, useStyles } from '../hooks/useStyles';
import TagRevisionItem from "../tagging/TagRevisionItem";

const styles = defineStyles("RecentDiscussionTagRevisionItem", (theme) => ({
  root: {
    backgroundColor: theme.palette.panelBackground.recentDiscussionThread,
    marginBottom: 32,
    position: "relative",
    boxShadow: theme.palette.boxShadow.default,
    borderRadius: theme.borderRadius["small"],

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
  const classes = useStyles(styles);
  if (tag.adminOnly) {
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

export default RecentDiscussionTagRevisionItem;
