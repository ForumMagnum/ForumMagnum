import React, { useState } from 'react';
import { registerComponent } from '../../../lib/vulcan-lib/components';
import MoreVertIcon from '@/lib/vendor/@material-ui/icons/src/MoreVert';
import { Menu } from '@/components/widgets/Menu';
import { useCurrentUserId } from '../../common/withUser';
import { useTracking } from "../../../lib/analyticsEvents";
import { isFriendlyUI } from '../../../themes/forumTheme';
import CommentActions from "./CommentActions";

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

interface CommentsMenuComponentProps {
  comment: CommentsList;
  post?: PostsMinimumInfo;
  tag?: TagBasicInfo | null;
  showEdit: () => void;
}

const CommentsMenu = ({classes, className, comment, post, tag, showEdit, icon, ActionsComponent}: {
  classes: ClassesType<typeof styles>,
  className?: string,
  comment: CommentsList,
  post?: PostsMinimumInfo,
  tag?: TagBasicInfo,
  showEdit: () => void,
  icon?: any,
  ActionsComponent?: React.ComponentType<CommentsMenuComponentProps>,
}) => {
  const [anchorEl, setAnchorEl] = useState<any>(null);

  // Render menu-contents if the menu has ever been opened (keep rendering
  // contents when closed after open, because of closing animation).
  const [everOpened, setEverOpened] = useState(false);

  const isLoggedIn = !!useCurrentUserId();
  const { captureEvent } = useTracking({eventType: "commentMenuClicked", eventProps: {commentId: comment._id, itemType: "comment"}})

  if (!isLoggedIn) return null

  const MenuComponent = ActionsComponent ?? CommentActions;

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
        {everOpened && <MenuComponent
          comment={comment}
          post={post}
          tag={tag}
          showEdit={showEdit}
        />}
      </Menu>
    </>
  )
}

export default registerComponent('CommentsMenu', CommentsMenu, {styles});



