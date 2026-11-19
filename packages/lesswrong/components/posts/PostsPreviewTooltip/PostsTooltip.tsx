import React, { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Placement as PopperPlacementType } from "popper.js"
import { DialogueMessageInfo, PostsPreviewTooltip } from "./PostsPreviewTooltip";
import {
  DialogueMessagePreviewTooltip,
  PostsPreviewTooltipSingle,
  PostsPreviewTooltipSingleWithComment,
  TaggedPostTooltipSingle,
} from "./PostsPreviewTooltipSingle";
import HoverOver from "../../common/HoverOver";
import { usePostForTooltip } from "@/components/hooks/usePostForTooltip";
import { defineStyles, useStyles } from "@/components/hooks/useStyles";

const styles = defineStyles("PostsTooltip", (_theme: ThemeType) => ({
  sentinel: {
    height: 0,
    width: 0,
    visibility: "hidden",
    overflow: "hidden",
  },
}));

interface PostsTooltipPropsBase {
  comment?: CommentsList,
  commentId?: string,
  tagRelId?: string,
  dialogueMessageInfo?: DialogueMessageInfo,
  hash?: string | null,
  postsList?: boolean,
  inlineBlock?: boolean,
  As?: 'span' | 'div',
  clickable?: boolean,
  flip?: boolean,
  placement?: PopperPlacementType,
  children?: ReactNode,
  pageElementContext?: string,
  pageElementSubContext?: string,
  //bypasses the component and just returns the children
  disabled?: boolean,
  className?: string,
}

type PostsTooltipProps = PostsTooltipPropsBase & (
  {
    post?: PostsList | SunshinePostsList | null,
    postId?: never,
    /**
     * If set to 'on-screen', the post will be preloaded when the tooltip anchor element enters the screen
     */
    preload?: never,
  } | {
    post?: never,
    postId: string,
    /**
     * If set to 'on-screen', the post will be preloaded when the tooltip anchor element enters the screen
     */
    preload?: 'on-screen'
  }
);

const PostsTooltip = ({
  post,
  postId,
  comment,
  commentId,
  tagRelId,
  dialogueMessageInfo,
  hash,
  postsList,
  inlineBlock=false,
  As,
  clickable,
  flip,
  placement,
  children,
  pageElementContext,
  pageElementSubContext,
  disabled,
  preload,
  className,
}: PostsTooltipProps) => {
  const classes = useStyles(styles);
  const [onScreen, setOnScreen] = useState(false);
  const tooltipContainerRef = useRef(null);
  
  // If we're getting a post id instead of a post and the relevant preload option is set,
  // we want to prefetch the post when the tooltip anchor element enters the screen.
  const prefetchPost = useMemo(() => onScreen && preload === 'on-screen', [onScreen, preload]);
  usePostForTooltip(postId, {
    skip: !postId || !prefetchPost,
  });

  useEffect(() => {
    const presenceObserver = new IntersectionObserver(([entry]) => {
      setOnScreen(entry.isIntersecting);
    }, { root: null, threshold: 0 });

    const tooltipContainer = tooltipContainerRef.current;
    if (!tooltipContainer) return;

    presenceObserver.observe(tooltipContainer);

    return () => presenceObserver.disconnect();
  }, []);

  const renderTitle = useCallback(() => {
    if (tagRelId) {
      return (
        <TaggedPostTooltipSingle tagRelId={tagRelId} />
      );
    }
    if (post) {
      return (
        <PostsPreviewTooltip
          post={post}
          postsList={postsList}
          comment={comment}
          hash={hash}
        />
      );
    }

    if (postId) {
      if (dialogueMessageInfo) {
        return <DialogueMessagePreviewTooltip postId={postId} dialogueMessageInfo={dialogueMessageInfo}/>
      }

      const actualCommentId = commentId ?? comment?._id;
      return actualCommentId
        ? (
          <PostsPreviewTooltipSingleWithComment
            postId={postId}
            commentId={actualCommentId}
          />
        )
        : (
          <PostsPreviewTooltipSingle
            postId={postId}
            postsList={postsList}
          />
        );
    }
    return null;
  }, [tagRelId, post, postId, postsList, comment, commentId, dialogueMessageInfo, hash]);

  if (disabled) {
    return <>
    {children}
    </>
  };
  return (
    <HoverOver
      title={renderTitle()}
      placement={placement}
      tooltip={false}
      hideOnTouchScreens
      inlineBlock={inlineBlock}
      As={As}
      clickable={clickable}
      flip={flip}
      analyticsProps={{
        pageElementContext,
        pageElementSubContext,
        postId: postId ?? post?._id,
      }}
      className={className}
    >
      {children}
      {preload === 'on-screen' && <span ref={tooltipContainerRef} className={classes.sentinel} />}
    </HoverOver>
  );
}

export default PostsTooltip;
