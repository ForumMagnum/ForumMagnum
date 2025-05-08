import React from "react";
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { Link } from "../../lib/reactRouterWrapper";
import CommentOutlinedIcon from "@/lib/vendor/@material-ui/icons/src/ModeCommentOutlined";
import { useHover } from "../common/withHover";
import { useMulti } from "../../lib/crud/withMulti";
import { tagGetDiscussionUrl } from "../../lib/collections/tags/helpers";
import classNames from "classnames";
import { isFriendlyUI } from "@/themes/forumTheme";

const styles = (theme: ThemeType) => ({
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
      alignSelf: "flex-start", //appears too low when there's no label
      marginTop: isFriendlyUI ? undefined : -2,
    }
  },
  discussionCountWithoutLabel: {
    alignSelf: "flex-start", //appears too low when there's no label
    marginTop: -2,
  },
  hideOnMobile: {
    marginRight: 2,
    [theme.breakpoints.down('sm')]: { //optimized or tag paye
      display: "none"
    }
  },
  hideLabel: {
    display: "none",
  },
  text: {
    marginRight: 2,
  }
});


const TagDiscussionButtonInner = ({tag, text = "Discussion", hideLabel = false, hideParens = false, hideLabelOnMobile = false, classes}: {
  tag: TagFragment | TagBasicInfo | TagCreationHistoryFragment,
  text?: string,
  hideLabel?: boolean,
  hideParens?: boolean,
  hideLabelOnMobile?: boolean,
  classes: ClassesType<typeof styles>,
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

  const labelClass = hideLabel ? classes.hideLabel : classes.text;
  const labelOnMobileClass = hideLabelOnMobile ? classes.hideOnMobile : classes.text;

  const discussionCountClass = hideLabel ? classes.discussionCountWithoutLabel : classes.discussionCount;

  // We want to avoid a flickering popper appearing and disappearing if the user hovers over the button when we already know there aren't any comments.
  const showDiscussionPopper = hover && (loading || (totalCount ?? 0) > 0);
  
  return <Link
    className={classes.discussionButton}
    to={tagGetDiscussionUrl(tag)}
    {...eventHandlers}
  >
    <CommentOutlinedIcon className={classes.discussionButtonIcon} />
    <span className={classNames(labelClass, labelOnMobileClass)}>{text}</span>
    {!loading && <span className={discussionCountClass}>{hideParens ? (totalCount ?? 0) : `(${totalCount ?? 0})`}</span>}
    <PopperCard open={showDiscussionPopper} anchorEl={anchorEl} placement="bottom-start" >
      <TagDiscussion tag={tag}/>
    </PopperCard>
  </Link>
}

export const TagDiscussionButton = registerComponent("TagDiscussionButton", TagDiscussionButtonInner, {styles});

declare global {
  interface ComponentTypes {
    TagDiscussionButton: typeof TagDiscussionButton
  }
}
