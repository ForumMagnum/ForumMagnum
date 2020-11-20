import React from "react";
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { Link } from "../../lib/reactRouterWrapper";
import CommentOutlinedIcon from "@material-ui/icons/ModeCommentOutlined";
import { useHover } from "../common/withHover";

const styles = (theme: ThemeType): JssStyles => ({
  discussionButton: {
    ...theme.typography.commentStyle,
    ...theme.typography.body2,
    ...theme.typography.uiStyle,
    color: theme.palette.grey[700],
    display: "flex",
    '& svg': {
      height: 20,
      width: 20,
      marginRight: 4,
      cursor: "pointer",
      color: theme.palette.grey[700]
    },
    alignItems: "center",
    marginRight: 8,
    marginLeft: "auto"
  }
});


const TagDiscussionButton = ({tag, text = "Discussion", classes}: {
  tag: TagFragment | TagBasicInfo | TagCreationHistoryFragment,
  text?: string,
  classes: ClassesType,
}) => {
  
  const { TagDiscussion, PopperCard } = Components
  const { hover, anchorEl, eventHandlers } = useHover()
  
  return <Link className={classes.discussionButton} to={`/tag/${tag.slug}/discussion`} {...eventHandlers}>
      <CommentOutlinedIcon/> {text}
      <PopperCard open={hover} anchorEl={anchorEl} placement="bottom-start" >
        <TagDiscussion tag={tag}/>
      </PopperCard>
  </Link>
}

const TagDiscussionButtonComponent = registerComponent("TagDiscussionButton", TagDiscussionButton, {styles});

declare global {
  interface ComponentTypes {
    TagDiscussionButton: typeof TagDiscussionButtonComponent
  }
}
