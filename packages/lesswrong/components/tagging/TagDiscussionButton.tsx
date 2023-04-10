import React from "react";
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { Link } from "../../lib/reactRouterWrapper";
import CommentOutlinedIcon from "@material-ui/icons/ModeCommentOutlined";
import { useHover } from "../common/withHover";
import { useMulti } from "../../lib/crud/withMulti";
import { tagGetDiscussionUrl } from "../../lib/collections/tags/helpers";

const styles = (theme: ThemeType): JssStyles => ({
  discussionButton: {
    ...theme.typography.commentStyle,
    ...theme.typography.body2,
    color: theme.palette.grey[700],
    display: "flex",
    alignItems: "center",
    marginLeft: "auto"
  },
  discussionButtonIcon: {
    height: 20,
    width: 20,
    marginRight: 4,
    cursor: "pointer",
    color: theme.palette.grey[700]
  },
  discussionCount: {
    [theme.breakpoints.down('sm')]: {
      alignSelf: "flex-start" //appears to low when there's no label
    }
  },
  hideOnMobile: {
    marginRight: 2,
    [theme.breakpoints.down('sm')]: { //optimized or tag paye
      display: "none"
    }
  }
});


const TagDiscussionButton = ({tag, text = "Discussion", hideLabelOnMobile = false, classes}: {
  tag: TagFragment | TagBasicInfo | TagCreationHistoryFragment,
  text?: string,
  hideLabelOnMobile?: boolean,
  classes: ClassesType,
}) => {
  
  const { TagDiscussion, PopperCard } = Components
  const { hover, anchorEl, eventHandlers } = useHover()
  const { totalCount, loading } = useMulti({
    terms: {
      view: "tagDiscussionComments",
      tagId: tag._id,
      limit: 0,
    },
    collectionName: "Comments",
    fragmentName: 'CommentsList',
    enableTotal: true,
  });
  
  return <Link
    className={classes.discussionButton}
    to={tagGetDiscussionUrl(tag)}
    {...eventHandlers}
  >
    <CommentOutlinedIcon className={classes.discussionButtonIcon} />
    <span className={hideLabelOnMobile ? classes.hideOnMobile : null}>{text}</span>
    {!loading && <span className={classes.discussionCount}>&nbsp;{`(${totalCount || 0})`}</span>}
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
