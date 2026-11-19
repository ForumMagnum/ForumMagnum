import React from 'react';
import { DialogueMessageInfo, PostsPreviewTooltip } from './PostsPreviewTooltip';
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen";
import PostsPreviewLoading from "./PostsPreviewLoading";
import { usePostForTooltip } from '@/components/hooks/usePostForTooltip';

const TagRelFragmentQuery = gql(`
  query PostsPreviewTooltipSingle4($documentId: String) {
    tagRel(input: { selector: { documentId: $documentId } }) {
      result {
        ...TagRelFragment
      }
    }
  }
`);

const CommentsListQuery = gql(`
  query PostsPreviewTooltipSingle3($documentId: String) {
    comment(input: { selector: { documentId: $documentId } }) {
      result {
        ...CommentsList
      }
    }
  }
`);

export const PostsPreviewTooltipSingle = ({postId, postsList=false}: {
  postId: string,
  postsList?: boolean
}) => {
  const { loading: postLoading, data } = usePostForTooltip(postId);
  const post = data?.post?.result;

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
  const { loading: postLoading, data } = usePostForTooltip(postId);
  const post = data?.post?.result;

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
  const { loading: postLoading, data: dataPost } = usePostForTooltip(postId);
  const post = dataPost?.post?.result;

  const { loading: commentLoading, data: dataComment } = useQuery(CommentsListQuery, {
    variables: { documentId: commentId },
    fetchPolicy: 'cache-first',
  });
  const comment = dataComment?.comment?.result;

  if (postLoading || commentLoading) {
    return <PostsPreviewLoading />
  }

  if (!post) {return null;}

  return (
    <PostsPreviewTooltip
      post={post}
      comment={commentId && comment ? comment : undefined}
    />
  );
}

export const TaggedPostTooltipSingle = ({tagRelId}: {tagRelId: string}) => {
  const { loading: tagRelLoading, data } = useQuery(TagRelFragmentQuery, {
    variables: { documentId: tagRelId },
    fetchPolicy: 'cache-first',
  });
  const tagRel = data?.tagRel?.result;

  if (tagRelLoading) {
    return <PostsPreviewLoading />
  }

  if (!tagRel?.post) {return null;}

  return <PostsPreviewTooltip post={tagRel.post} />
}
