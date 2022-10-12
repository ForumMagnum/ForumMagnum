import React from "react";
import { registerComponent } from '../../lib/vulcan-lib';
import { Link } from "../../lib/reactRouterWrapper";
import CommentOutlinedIcon from "@material-ui/icons/ModeCommentOutlined";
import { tagGetSubforumUrl } from "../../lib/collections/tags/helpers";
import { AnalyticsContext } from "../../lib/analyticsEvents";

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


const TagSubforumButton = ({
  tag,
  classes,
}: {
  tag: TagPageFragment | TagPageWithRevisionFragment;
  classes: ClassesType;
}) => {
  const url = tagGetSubforumUrl(tag);
  return (
    <AnalyticsContext pageElementContext="subforumLink" resourceUrl={url}>
      <Link className={classes.discussionButton} to={tagGetSubforumUrl(tag)}>
        <CommentOutlinedIcon className={classes.discussionButtonIcon} />
        <span className={classes.hideOnMobile}>Subforum</span>
        <span className={classes.discussionCount}>&nbsp;{`(${tag.subforumUnreadMessagesCount || 0})`}</span>
      </Link>
    </AnalyticsContext>
  );
};

const TagSubforumButtonComponent = registerComponent("TagSubforumButton", TagSubforumButton, {styles});

declare global {
  interface ComponentTypes {
    TagSubforumButton: typeof TagSubforumButtonComponent
  }
}
