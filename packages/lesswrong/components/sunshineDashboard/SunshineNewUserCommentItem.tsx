import { registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import CommentsNodeInner from "../comments/CommentsNode";
import RejectedContentControls from "./RejectedContentControls";
import ForumIcon from "../common/ForumIcon";

const styles = (theme: ThemeType) => ({
  comment: {
    marginBottom: 16,
    marginTop: 16,
  },
  rejection: {
    display: "flex",
    justifyContent: "space-between",
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
})

const SunshineNewUserCommentItem = ({comment, classes}: {
  comment: CommentsListWithParentMetadata,
  classes?: ClassesType<typeof styles>,
}) => {
  const [isCollapsed, setIsCollapsed] = React.useState<boolean>(false);

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

export default registerComponent('SunshineNewUserCommentItem', SunshineNewUserCommentItem, {styles}); 