import React from 'react';
import { useQuery } from '@/lib/crud/useQuery';
import { gql } from '@/lib/generated/gql-codegen';
import SectionTitle from '../common/SectionTitle';
import PostsItem from './PostsItem';
import Loading from '../vulcan-core/Loading';

const UNAPPROVED_POSTS_QUERY = gql(`
  query UnapprovedPostsListQuery($selector: PostSelector, $limit: Int) {
    posts(selector: $selector, limit: $limit) {
      results {
        ...PostsListWithVotes
      }
      totalCount
    }
  }
`);

const UnapprovedPostsList = ({ userId }: { userId: string }) => {
  const { data, loading } = useQuery(UNAPPROVED_POSTS_QUERY, {
    variables: {
      selector: { userPosts: { userId, sortedBy: "new", authorIsUnreviewed: true } },
      limit: 50,
    },
    ssr: false,
  });

  const results = data?.posts?.results;

  if (loading && !results) {
    return <Loading />;
  }

  if (!results || results.length === 0) {
    return null;
  }

  return <>
    <SectionTitle title="Unapproved Posts" />
    {results.map((post, i) => (
      <PostsItem
        key={post._id}
        post={post}
        hideAuthor
        showDraftTag={false}
        showPersonalIcon={false}
        showBottomBorder={i < results.length - 1}
      />
    ))}
  </>;
};

export default UnapprovedPostsList;
