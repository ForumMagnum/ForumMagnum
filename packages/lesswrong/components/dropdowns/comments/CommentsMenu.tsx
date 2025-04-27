import React, { useState } from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib/components';
import MoreVertIcon from '@/lib/vendor/@material-ui/icons/src/MoreVert';
import { Menu } from '@/components/widgets/Menu';
import { useCurrentUser } from '../../common/withUser';
import { useTracking } from "../../../lib/analyticsEvents";
import { isFriendlyUI } from '../../../themes/forumTheme';

const styles = (_theme: ThemeType) => ({
  root: {
    ...(isFriendlyUI && {
      "& .MuiList-padding": {
        padding: 0,
      },
    }),
  },
  icon: {
    cursor: "pointer",
    fontSize:"1.4rem"
  },
})

const CommentsMenu = ({classes, className, comment, post, tag, showEdit, icon}: {
  classes: ClassesType<typeof styles>,
  className?: string,
  comment: CommentsList,
  post?: PostsMinimumInfo,
  tag?: TagBasicInfo,
  showEdit: () => void,
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
        {icon ? icon : <MoreVertIcon className={classes.icon}/>}
      </span>
      <Menu
        onClick={() => {
          captureEvent("commentMenuClicked", {open: false})
          setAnchorEl(null)
        }}
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        className={classes.root}
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

