import React from 'react';
import PostsPageWrapper from "./PostsPage/PostsPageWrapper";
import { slugLooksLikeId } from '@/lib/utils/slugify';
import PostsSingleSlug from './PostsSingleSlug';
import { runQuery } from '@/server/vulcan-lib/query';
import { gql } from '@/lib/generated/gql-codegen';
import Error404 from '../common/Error404';
import PermanentRedirect from '../common/PermanentRedirect';
import { getResolverContextForServerComponent } from '@/server/pageMetadata/sharedMetadata';

type PostPageIdentifier = 
  { idOrSlug: string }
  | { slug: string, collectionSlug?: string }
  | { _id: string, slug?: string }
type PostPageCommonProps = {
  redirectBehavior?: "redirectToCanonical" | "noRedirect";
  searchParams: Promise<PostPageSearchParams>;
  groupId?: string;
  sequenceId?: string
}
export type PostPageSearchParams = {
  revision?: string;
}

const PostsSingleQuery = gql(`
  query PostsSingleQuery($selector: SelectorInputWithSlug) {
    post(input: { selector: $selector }, allowNull: true) {
      result {
        _id pageUrlRelative
      }
    }
  }
`);

export async function PostsSingle (props: PostPageCommonProps & PostPageIdentifier) {
  const version = (await props.searchParams).revision ?? undefined;
  const sequenceId = props.sequenceId ?? null;
  const resolverContext = await getResolverContextForServerComponent(await props.searchParams);

  const selector = propsToSelector(props);
  const { data } = await runQuery(PostsSingleQuery, {
    selector,
  }, resolverContext);
  const post = data?.post?.result;

  if (!post) {
    return <Error404 />
  }

  const canonicalUrl = post.pageUrlRelative;
  const redirectBehavior = props.redirectBehavior ?? "redirectToCanonical";
  return <PostsPageWrapper documentId={post._id} sequenceId={sequenceId} version={version} redirectBehavior={redirectBehavior} canonicalUrl={canonicalUrl} />
};

function propsToSelector(props: PostPageCommonProps & PostPageIdentifier): SelectorInputWithSlug {
  if ('idOrSlug' in props) {
    if (slugLooksLikeId(props.idOrSlug)) {
      return {
        _id: props.idOrSlug,
      };
    } else {
      return {
        slug: props.idOrSlug,
      };
    }
  } else if ('_id' in props) {
    return {
      _id: props._id,
    };
  } else {
    return {
      slug: props.slug,
    };
  }
}
