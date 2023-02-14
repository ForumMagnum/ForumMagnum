import React from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib';
import LinkIcon from '@material-ui/icons/Link';
import { commentGetPageUrlFromIds } from "../../../lib/collections/comments/helpers";
import classNames from 'classnames';
import { useTracking } from '../../../lib/analyticsEvents';
import { useMessages } from '../../common/withMessages';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    "& a:hover, & a:active": {
      "& $icon": {
        color: `${theme.palette.icon.dim5} !important`,
      },
    },
    
    // Create a stacking context and set z-index to be higher than the vote
    // buttons, which are to the right of this and have a click-target that
    // partially overlaps.
    position: "relative",
    
    // Prevent permalink-icon and date from wrapping onto separate lines, in
    // narrow/flexbox contexts
    whiteSpace: "nowrap",
    
    zIndex: theme.zIndexes.commentPermalinkIcon,
  },
  answerDate: {},
  date: {
    color: theme.palette.text.dim,
  },
  postTitle: {
    marginRight: 5,
  },
  link: {
  },
  icon: {
    fontSize: "0.9rem",
    transform: "rotate(-45deg)",
    verticalAlign: "middle",
    color: theme.palette.icon.dim,
    margin: "0 2px",
    position: "relative",
    top: -2
  },
});

const CommentsItemDate = ({comment, post, tag, classes, permalink=true }: {
  comment: CommentsList,
  post?: PostsMinimumInfo|null,
  tag?: TagBasicInfo,
  classes: ClassesType,
  permalink?: boolean,
}) => {
  const { captureEvent } = useTracking();
  const { flash } = useMessages();

  const url = commentGetPageUrlFromIds({postId: post?._id, postSlug: post?.slug, tagSlug: tag?.slug, commentId: comment._id, tagCommentType: comment.tagCommentType, permalink, isAbsolute: true})

  const handleLinkClick = async (event: React.MouseEvent) => {
    event.preventDefault()
    captureEvent("linkClicked", {buttonPressed: event.button, furtherContext: "dateIcon"})
    await navigator.clipboard.writeText(url)
    flash({messageString: "Copied to clipboard", type: "success"})
  };

  const date = <>
    <Components.FormatDate date={comment.postedAt} format={comment.answer ? "MMM DD, YYYY" : undefined}/>
    <LinkIcon className={classes.icon}/>
  </>

  return (
    <span className={classNames(classes.root, {
      [classes.date]: !comment.answer,
      [classes.answerDate]: comment.answer,
    })}>
      {/* It never actually follows the link on click, but making this an <a> means you can also copy the link by right clicking, which some people might instinctively do */}
      <a rel="nofollow" href={url} onClick={handleLinkClick}>{ date }</a>
    </span>
  );
}

const CommentsItemDateComponent = registerComponent(
  'CommentsItemDate', CommentsItemDate, {styles}
);

declare global {
  interface ComponentTypes {
    CommentsItemDate: typeof CommentsItemDateComponent,
  }
}

