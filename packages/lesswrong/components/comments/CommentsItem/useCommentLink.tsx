import React, { FC, MouseEvent, PropsWithChildren, useContext } from "react";
import { useTracking } from "../../../lib/analyticsEvents";
import { commentGetPageUrlFromIds } from "../../../lib/collections/comments/helpers";
import { useSubscribedLocation } from "../../../lib/routeUtil";
import { Link, useNavigate } from "../../../lib/reactRouterWrapper";
import qs from "qs";
import { commentPermalinkStyleSetting } from "@/lib/publicSettings";
import { EnvironmentOverrideContext } from "@/lib/utils/timeUtil";

export type UseCommentLinkProps = {
  comment: Pick<CommentsList, "_id" | "tagCommentType">,
  post?: Pick<PostsMinimumInfo, "_id" | "slug"> | null,
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
  permalink,
}: UseCommentLinkProps) => {
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

    // If the current location is not the same as the link's location (e.g. if a
    // comment on a post is showing on the frontpage), fall back to just following
    // the link
    if (location.pathname !== url.split("?")[0]) {
      return;
    }

    event.preventDefault();
    const navigateArgs = {
      search: qs.stringify({...query, commentId: comment._id}),
      hash: null,
    }
    navigate({
      ...location,
      ...navigateArgs
    });

    if (scrollIntoView) {
      scrollIntoView();
    }
  }

  const Wrapper: FC<PropsWithChildren<{}>> = scrollOnClick
    ? ({children}) => (
      <a rel="nofollow" href={url} onClick={handleLinkClick}>
        {children}
      </a>
    )
    : ({children}) => (
      <Link rel="nofollow" to={url} eventProps={{furtherContext}}>
        {children}
      </Link>
    );

  return Wrapper;
}

export const useCommentLinkState = () => {
  const { query, hash } = useSubscribedLocation();
  const { matchSSR } = useContext(EnvironmentOverrideContext);

  const queryId = query.commentId
  const hashId = matchSSR ? '' : hash.slice(1)

  const scrollToCommentId = commentPermalinkStyleSetting.get() === 'in-context' ? queryId ?? hashId : hashId

  return { linkedCommentId: queryId, scrollToCommentId }
}
