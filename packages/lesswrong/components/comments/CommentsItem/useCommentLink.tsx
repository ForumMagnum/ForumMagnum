import React, { MouseEvent, PropsWithChildren } from "react";
import { useTracking } from "../../../lib/analyticsEvents";
import { commentGetPageUrlFromIds } from "../../../lib/collections/comments/helpers";
import { useLocation } from "../../../lib/routeUtil";
import { Link, useNavigate } from "../../../lib/reactRouterWrapper";
import qs from "qs";

export type UseCommentLinkProps = {
  comment: CommentsList,
  post?: PostsMinimumInfo|null,
  tag?: TagBasicInfo,
  scrollOnClick?: boolean,
  scrollIntoView?: () => void,
  permalink?: boolean,
}

export const useCommentLink = ({
  comment,
  post,
  tag,
  scrollOnClick,
  scrollIntoView,
  permalink = true,
}: UseCommentLinkProps) => {
  const navigate = useNavigate();
  const {location, query} = useLocation();
  const {captureEvent} = useTracking();

  const url = commentGetPageUrlFromIds({
    postId: post?._id,
    postSlug: post?.slug,
    tagSlug: tag?.slug,
    commentId: comment._id,
    tagCommentType: comment.tagCommentType,
    permalink,
  });

  const furtherContext = "dateIcon"; // For historical reasons

  const handleLinkClick = (event: MouseEvent) => {
    captureEvent("linkClicked", {
      buttonPressed: event.button,
      furtherContext,
    });

    // If the current location is not the same as the link's location (e.g. if a
    // comment on a post is showing on the frontpage), fall back to just following
    // the link
    if (location.pathname !== url.split("?")[0]) {
      return;
    }

    event.preventDefault();
    navigate({
      ...location,
      search: qs.stringify({...query, commentId: comment._id}),
      hash: null,
    });

    if (scrollIntoView) {
      scrollIntoView();
    }
  }

  const Wrapper = scrollOnClick
    ? ({children}: PropsWithChildren) => (
      <a rel="nofollow" href={url} onClick={handleLinkClick}>
        {children}
      </a>
    )
    : ({children}: PropsWithChildren) => (
      <Link rel="nofollow" to={url} eventProps={{furtherContext}}>
        {children}
      </Link>
    );

  return Wrapper;
}
