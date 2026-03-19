import React from 'react';
import PostsPageWrapper from "./PostsPage/PostsPageWrapper";
import { slugLooksLikeId } from '@/lib/utils/slugify';
import PostsSingleSlug from './PostsSingleSlug';

type PostPageIdentifier = 
  { idOrSlug: string }
  | { slug: string, collectionSlug?: string }
  | { _id: string, slug?: string }
type PostPageCommonProps = {
  searchParams: Promise<PostPageSearchParams>;
  groupId?: string;
  sequenceId?: string
}
export type PostPageSearchParams = {
  revision?: string;
}

export async function PostsSingle (props: PostPageCommonProps & PostPageIdentifier) {
  const version = (await props.searchParams).revision ?? undefined;
  const sequenceId = props.sequenceId ?? null;

  if ('idOrSlug' in props) {
    if (slugLooksLikeId(props.idOrSlug)) {
      return <PostsSingleSlug slug={props.idOrSlug} sequenceId={sequenceId} version={version} />
    } else {
      return <PostsPageWrapper documentId={props.idOrSlug} sequenceId={sequenceId} version={version} />
    }
  } else if ('_id' in props) {
    return <PostsPageWrapper documentId={props._id} sequenceId={sequenceId} version={version} />
  } else {
    return <PostsSingleSlug slug={props.slug} sequenceId={sequenceId} version={version} />
  }
};
