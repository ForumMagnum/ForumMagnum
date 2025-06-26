import { registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import CommentsNodeInner from "../comments/CommentsNode";
import RejectedContentControls from "./RejectedContentControls";
import ForumIcon from "../common/ForumIcon";
import { defineStyles, useStyles } from '../hooks/useStyles';

const styles = defineStyles("SunshineNewUserCommentItem", (theme: ThemeType) => ({  
  comment: {
    marginBottom: 16,
    marginTop: 16,
  },
  rejection: {
    display: "flex",
    justifyContent: "space-between",
    paddingLeft: 8,
    width: "100%",
    backgroundColor: theme.palette.grey[200],
    alignItems: "center",
  },
  expandCollapseButton: {
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    marginRight: 8,
    color: theme.palette.grey[600],
  },
}));

const SunshineNewUserCommentItem = ({comment}: {
  comment: CommentsListWithParentMetadata,
}) => {
  const classes = useStyles(styles);
  const [isCollapsed, setIsCollapsed] = React.useState<boolean>(!!comment.rejected);

  const toggleCollapse = () => setIsCollapsed(prev => !prev);

  return <div className={classes?.comment}>
    <div className={classes?.rejection}>
      <ForumIcon className={classes?.expandCollapseButton} icon={isCollapsed ? "ThickChevronRight" : "ThickChevronDown"} onClick={toggleCollapse} />
      <RejectedContentControls contentWrapper={{collectionName:"Comments", content:comment}}/>
    </div>
    {!isCollapsed && <CommentsNodeInner 
      treeOptions={{
        condensed: false,
        post: comment.post || undefined,
        showPostTitle: true,
      }}
      forceUnTruncated
      forceUnCollapsed
      comment={comment}
    />}
  </div>
}

export default registerComponent('SunshineNewUserCommentItem', SunshineNewUserCommentItem); 