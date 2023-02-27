import React from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib';
import { Link } from '../../../lib/reactRouterWrapper';
import { commentGetPageUrlFromIds } from "../../../lib/collections/comments/helpers";
import classNames from 'classnames';
import { useNavigation, useLocation } from '../../../lib/routeUtil';
import { useTracking } from '../../../lib/analyticsEvents';
import qs from 'qs'
import { USE_FRIENDLY_ICONS } from '../../common/ForumIcon';

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
    fontSize: "0.9rem !important",
    transform: USE_FRIENDLY_ICONS ? undefined : "rotate(-45deg)",
    verticalAlign: "middle",
    color: theme.palette.icon.dim,
    margin: "0 2px",
    position: "relative",
    top: -2,
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

  const url = commentGetPageUrlFromIds({postId: post?._id, postSlug: post?.slug, tagSlug: tag?.slug, commentId: comment._id, tagCommentType: comment.tagCommentType, permalink})

  const handleLinkClick = (event: React.MouseEvent) => {
    captureEvent("linkClicked", {buttonPressed: event.button, furtherContext: "dateIcon"})
    
    // If the current location is not the same as the link's location (e.g. if a comment on a post is showing on the frontpage), fall back to just following the link
    if (location.pathname !== url.split("?")[0]) return

    event.preventDefault()
    history.replace({...location, search: qs.stringify({...query, commentId: comment._id})})
    if(scrollIntoView) scrollIntoView();
  };

  const date = <>
    <Components.FormatDate date={comment.postedAt} format={comment.answer ? "MMM DD, YYYY" : undefined}/>
    <Components.ForumIcon icon="Link" className={classes.icon} />
  </>

  return (
    <span className={classNames(classes.root, {
      [classes.date]: !comment.answer,
      [classes.answerDate]: comment.answer,
    })}>
      {scrollOnClick ? <a rel="nofollow" href={url} onClick={handleLinkClick}>{ date } </a>
        : <Link rel="nofollow" to={url} eventProps={{furtherContext: "dateIcon"}} >{ date }</Link>
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

