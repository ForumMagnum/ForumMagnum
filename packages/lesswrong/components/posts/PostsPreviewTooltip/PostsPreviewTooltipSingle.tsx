import React from 'react';
import { Components } from '../../../lib/vulcan-lib/components';
import { DialogueMessageInfo, PostsPreviewTooltip } from './PostsPreviewTooltip';
import { useQuery } from "@apollo/client";
import { gql } from "@/lib/generated/gql-codegen/gql";

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

const PostsListQuery = gql(`
  query PostsPreviewTooltipSingle($documentId: String) {
    post(input: { selector: { documentId: $documentId } }) {
      result {
        ...PostsList
      }
    }
  }
`);

export const PostsPreviewTooltipSingle = ({postId, postsList=false}: {
  postId: string,
  postsList?: boolean
}) => {
  const { loading: postLoading, data } = useQuery(PostsListQuery, {
    variables: { documentId: postId },
    fetchPolicy: 'cache-then-network' as AnyBecauseTodo,
  });
  const post = data?.post?.result;

  const {PostsPreviewLoading} = Components;
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
  const { loading: postLoading, data } = useQuery(PostsListQuery, {
    variables: { documentId: postId },
    fetchPolicy: 'cache-then-network' as AnyBecauseTodo,
  });
  const post = data?.post?.result;

  const {PostsPreviewLoading} = Components;
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
  const { loading: postLoading, data: dataPost } = useQuery(PostsListQuery, {
    variables: { documentId: postId },
    fetchPolicy: 'cache-then-network' as AnyBecauseTodo,
  });
  const post = dataPost?.post?.result;

  const { loading: commentLoading, data: dataComment } = useQuery(CommentsListQuery, {
    variables: { documentId: commentId },
    fetchPolicy: 'cache-then-network' as AnyBecauseTodo,
  });
  const comment = dataComment?.comment?.result;

  const {PostsPreviewLoading} = Components;
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
  const { loading: tagRelLoading, data } = useQuery(TagRelFragmentQuery, {
    variables: { documentId: tagRelId },
    fetchPolicy: 'cache-then-network' as AnyBecauseTodo,
  });
  const tagRel = data?.tagRel?.result;

  const {PostsPreviewLoading} = Components;
  if (tagRelLoading) {
    return <PostsPreviewLoading />
  }

  if (!tagRel) {return null;}

  return <PostsPreviewTooltip post={tagRel.post} />
}
