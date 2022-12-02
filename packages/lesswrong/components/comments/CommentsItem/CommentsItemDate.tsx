import React from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib';
import { Link } from '../../../lib/reactRouterWrapper';
import LinkIcon from '@material-ui/icons/Link';
import { commentGetPageUrlFromIds } from "../../../lib/collections/comments/helpers";
import classNames from 'classnames';
import { useNavigation, useLocation } from '../../../lib/routeUtil';
import { useTracking } from '../../../lib/analyticsEvents';
import qs from 'qs'

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

const CommentsItemDate = ({comment, post, tag, classes, scrollOnClick, scrollIntoView, permalink=true }: {
  comment: CommentsList,
  post?: PostsMinimumInfo|null,
  tag?: TagBasicInfo,
  classes: ClassesType,
  scrollOnClick?: boolean,
  scrollIntoView?: ()=>void,
  permalink?: boolean,
}) => {
  const { history } = useNavigation();
  const { location, query } = useLocation();
  const { captureEvent } = useTracking();

  const handleLinkClick = (event: React.MouseEvent) => {
    event.preventDefault()
    history.replace({...location, search: qs.stringify({...query, commentId: comment._id})})
    if(scrollIntoView) scrollIntoView();
    captureEvent("linkClicked", {buttonPressed: event.button, furtherContext: "dateIcon"})
  };

  const url = commentGetPageUrlFromIds({postId: post?._id, postSlug: post?.slug, tagSlug: tag?.slug, commentId: comment._id, tagCommentType: comment.tagCommentType, permalink})

  const date = <>
    <Components.FormatDate date={comment.postedAt} format={comment.answer ? "MMM DD, YYYY" : undefined}/>
    <LinkIcon className={classes.icon}/>
  </>

  return (
    <span className={classNames(classes.root, {
      [classes.date]: !comment.answer,
      [classes.answerDate]: comment.answer,
    })}>
      {scrollOnClick ? <a rel="nofollow" href={url} onClick={handleLinkClick}>{ date } </a>
        : <Link rel="nofollow" to={url}>{ date }</Link>
      }
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

