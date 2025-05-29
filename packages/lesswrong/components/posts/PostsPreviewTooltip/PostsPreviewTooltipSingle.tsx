import React from 'react';
import { useSingle } from '../../../lib/crud/withSingle';
import { DialogueMessageInfo, PostsPreviewTooltip } from './PostsPreviewTooltip';
import PostsPreviewLoading from "./PostsPreviewLoading";

export const PostsPreviewTooltipSingle = ({postId, postsList=false}: {
  postId: string,
  postsList?: boolean
}) => {
  const { document: post, loading: postLoading } = useSingle({
    collectionName: "Posts",
    fragmentName: 'PostsList',
    fetchPolicy: 'cache-first',
    documentId: postId,
  });
  if (postLoading) {
    return <PostsPreviewLoading />
  }

  if (!post) {return null;}

  return <PostsPreviewTooltip post={post} postsList={postsList}/>
}

export const DialogueMessagePreviewTooltip = ({postId, postsList=false, dialogueMessageInfo}: {
  postId: string,
  postsList?: boolean
  dialogueMessageInfo: DialogueMessageInfo,
}) => {
  const { document: post, loading: postLoading } = useSingle({
    collectionName: "Posts",
    fragmentName: 'PostsList',
    fetchPolicy: 'cache-first',
    documentId: postId,
  });
  if (postLoading) {
    return <PostsPreviewLoading />
  }

  if (!post) return null;

  return <PostsPreviewTooltip post={post} postsList={postsList} dialogueMessageInfo={dialogueMessageInfo}/>
}

export const PostsPreviewTooltipSingleWithComment = ({postId, commentId}: {
  postId: string,
  commentId: string,
}) => {
  const { document: post, loading: postLoading } = useSingle({
    collectionName: "Posts",
    fragmentName: 'PostsList',
    fetchPolicy: 'cache-first',
    documentId: postId,
  });

  const { document: comment, loading: commentLoading } = useSingle({
    collectionName: "Comments",
    fragmentName: 'CommentsList',
    fetchPolicy: 'cache-first',
    documentId: commentId,
  });
  if (postLoading || commentLoading) {
    return <PostsPreviewLoading />
  }

  if (!post) {return null;}

  return (
    <PostsPreviewTooltip
      post={post}
      comment={commentId ? comment : undefined}
    />
  );
}

export const TaggedPostTooltipSingle = ({tagRelId}: {tagRelId: string}) => {
  const { document: tagRel, loading: tagRelLoading } = useSingle({
    collectionName: "TagRels",
    fragmentName: 'TagRelFragment',
    fetchPolicy: 'cache-first',
    documentId: tagRelId,
  });
  if (tagRelLoading) {
    return <PostsPreviewLoading />
  }

  if (!tagRel) {return null;}

  return <PostsPreviewTooltip post={tagRel.post} />
}
