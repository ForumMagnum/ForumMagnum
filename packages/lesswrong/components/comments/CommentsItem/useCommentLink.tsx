import React, { FC, MouseEvent, PropsWithChildren, useContext, useSyncExternalStore } from "react";
import { useTracking } from "../../../lib/analyticsEvents";
import { commentGetPageUrlFromIds } from "../../../lib/collections/comments/helpers";
import qs from "qs";
import { commentPermalinkStyleSetting } from '@/lib/instanceSettings';
import { EnvironmentOverrideContext } from "@/lib/utils/timeUtil";
import { Link } from "../../../lib/reactRouterWrapper";
import { useNavigate, useSubscribedLocation } from "../../../lib/routeUtil";
import { isSpecialClick } from "@/lib/utils/eventUtils";
import { useMatchSSR } from "@/components/common/DeferRender";

export type UseCommentLinkProps = {
  comment: Pick<CommentsList, "_id" | "tagCommentType">,
  post?: Pick<PostsMinimumInfo, "_id" | "slug"> | null,
  tag?: TagBasicInfo,
  scrollOnClick?: boolean,
  scrollIntoView?: () => void,
  permalink?: boolean,
}

export const CommentLinkWrapper = ({
  comment,
  post,
  tag,
  scrollOnClick,
  scrollIntoView,
  permalink,
  children
}: UseCommentLinkProps & { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const {location, query} = useSubscribedLocation();
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
    if (isSpecialClick(event)) {
      return;
    }

    // If the current location is not the same as the link's location (e.g. if a
    // comment on a post is showing on the frontpage), fall back to just following
    // the link
    if (location.pathname !== url.split("?")[0]) {
      return;
    }

    event.preventDefault();
    const navigateArgs = {
      search: qs.stringify({...query, commentId: comment._id}),
      hash: undefined,
    }
    navigate({
      ...location,
      ...navigateArgs
    });

    if (scrollIntoView) {
      scrollIntoView();
    }
  }

  if (scrollOnClick) {
    return <a rel="nofollow" href={url} onClick={handleLinkClick}>
      {children}
    </a>
  } else {
    return <Link rel="nofollow" to={url} eventProps={{furtherContext}}>
      {children}
    </Link>
  }
}

/**
 * Retrieve the ids of the currently permalinked comment, and the comment that should be scrolled to.
 * If using 'in-context' links then these will both generally be the `?commentId=id` comment.
 * If using 'top' links then the permalinked comment will be the `?commentId=id` one and the scrollToCommentId
 * will be taken from the `#id` part of the URL if present.
 */
export const useCommentLinkState = () => {
  const { query, hash } = useSubscribedLocation();

  const queryId = query.commentId
  const hashId = hash.slice(1);

  // Hash is only available on the client, not the server; useSyncExternalStore suppresses
  // the SSR mismatch
  const scrollToCommentId = useSyncExternalStore(
    ()=>()=>{},
    () => commentPermalinkStyleSetting.get() === 'in-context' ? (queryId ?? hashId) : hashId,
    () => commentPermalinkStyleSetting.get() === 'in-context' ? queryId : "",
  ) ?? "";

  return { linkedCommentId: queryId, scrollToCommentId }
}
