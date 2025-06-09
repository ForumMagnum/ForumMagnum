import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { postGetPageUrl } from '@/lib/collections/posts/helpers';
import PermanentRedirect from "../common/PermanentRedirect";
import SingleColumnSection from "../common/SingleColumnSection";
import Loading from "../vulcan-core/Loading";
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen";

const PostsMinimumInfoMultiQuery = gql(`
  query multiPostCurrentOpenThreadPageQuery($selector: PostSelector, $limit: Int, $enableTotal: Boolean) {
    posts(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...PostsMinimumInfo
      }
      totalCount
    }
  }
`);

const CurrentOpenThreadPage = () => {
  const { data, loading } = useQuery(PostsMinimumInfoMultiQuery, {
    variables: {
      selector: { currentOpenThread: {} },
      limit: 1,
      enableTotal: false,
    },
    notifyOnNetworkStatusChange: true,
  });

  const results = data?.posts?.results;

  if (loading) {
    return <Loading />
  }

  const post = results?.[0];
  if (!post) {
    return <SingleColumnSection>No open thread found</SingleColumnSection>;
  }

  return <PermanentRedirect status={302} url={postGetPageUrl(post)} />
}

export default registerComponent('CurrentOpenThreadPage', CurrentOpenThreadPage);


