import React, { useState } from 'react';
import { registerComponent, Components } from '../../../lib/vulcan-lib';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import Menu from '@material-ui/core/Menu';
import { useCurrentUser } from '../../common/withUser';
import { useTracking } from "../../../lib/analyticsEvents";

const styles = (theme: ThemeType): JssStyles => ({
  icon: {
    cursor: "pointer",
    fontSize:"1.4rem"
  },
})

const CommentsMenu = ({classes, className, comment, post, tag, showEdit, icon}: {
  classes: ClassesType,
  className?: string,
  comment: CommentsList,
  post?: PostsMinimumInfo,
  tag?: TagBasicInfo,
  showEdit: ()=>void,
  icon?: any,
}) => {
  const [anchorEl, setAnchorEl] = useState<any>(null);
  
  // Render menu-contents if the menu has ever been opened (keep rendering
  // contents when closed after open, because of closing animation).
  const [everOpened, setEverOpened] = useState(false);
  
  const currentUser = useCurrentUser();
  const { captureEvent } = useTracking({eventType: "commentMenuClicked", eventProps: {commentId: comment._id, itemType: "comment"}})
  
  if (!currentUser) return null
  
  return (
    <>
      <span
        className={className}
        onClick={event => {
          captureEvent("commentMenuClicked", {open: true})
          setAnchorEl(event.currentTarget)
          setEverOpened(true);
        }}
      >
        {icon ? icon : <MoreVertIcon
          className={classes.icon}/>}
      </span>
      <Menu
        onClick={event => {
          captureEvent("commentMenuClicked", {open: false})
          setAnchorEl(null)
        }}
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
      >
        {everOpened && <Components.CommentActions
          currentUser={currentUser}
          comment={comment}
          post={post}
          tag={tag}
          showEdit={showEdit}
        />}
      </Menu>
    </>
  )
}

const CommentsMenuComponent = registerComponent('CommentsMenu', CommentsMenu, {styles});

declare global {
  interface ComponentTypes {
    CommentsMenu: typeof CommentsMenuComponent,
  }
}

