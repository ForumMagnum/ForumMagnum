import React, { useCallback } from 'react'
import { registerComponent } from '../../lib/vulcan-lib/components';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import { useLocation, useNavigate } from "../../lib/routeUtil";
import { useQuery } from "@apollo/client";
import { gql } from "@/lib/generated/gql-codegen/gql";
import SingleColumnSection from "../common/SingleColumnSection";
import RevisionSelect from "./RevisionSelect";
import Loading from "../vulcan-core/Loading";
import { useQueryWithLoadMore } from "@/components/hooks/useQueryWithLoadMore";

const RevisionMetadataWithChangeMetricsMultiQuery = gql(`
  query multiRevisionPostsRevisionSelectQuery($selector: RevisionSelector, $limit: Int, $enableTotal: Boolean) {
    revisions(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...RevisionMetadataWithChangeMetrics
      }
      totalCount
    }
  }
`);


const PostsDetailsQuery = gql(`
  query PostsRevisionSelect($documentId: String) {
    post(input: { selector: { documentId: $documentId } }) {
      result {
        ...PostsDetails
      }
    }
  }
`);

const styles = (theme: ThemeType) => ({
  revisionList: {
  },
});

const PostsRevisionSelect = ({ classes }: {
  classes: ClassesType<typeof styles>
}) => {
  const { params } = useLocation();
  const navigate = useNavigate();
  const postId = params._id;
  
  const { loading: loadingPost, data } = useQuery(PostsDetailsQuery, {
    variables: { documentId: postId },
  });
  
  const post = data?.post?.result;

  const { data: dataRevisionsOnDocument, loading: loadingRevisions, loadMoreProps } = useQueryWithLoadMore(RevisionMetadataWithChangeMetricsMultiQuery, {
    variables: {
      selector: { revisionsOnDocument: { documentId: post?._id, fieldName: "contents" } },
      limit: 10,
      enableTotal: false,
    },
    skip: !post,
    fetchPolicy: 'cache-first',
    notifyOnNetworkStatusChange: true,
  });

  const revisions = dataRevisionsOnDocument?.revisions?.results;
  
  const compareRevs = useCallback(({before,after}: {before: RevisionMetadata, after: RevisionMetadata}) => {
    if (!post) return;
    navigate(`/compare/post/${post._id}/${post.slug}?before=${before.version}&after=${after.version}`);
  }, [navigate, post]);

  if (!post) {return null;}
  
  return <SingleColumnSection>
    <h1>{post.title}</h1>
    
    {(loadingPost || loadingRevisions) && <Loading/>}
    
    <div className={classes.revisionList}>
      {revisions && <RevisionSelect
        revisions={revisions}
        getRevisionUrl={(rev: RevisionMetadata) => `${postGetPageUrl(post)}?revision=${rev.version}`}
        onPairSelected={compareRevs}
        loadMoreProps={loadMoreProps}
      />}
    </div>
  </SingleColumnSection>
}

export default registerComponent("PostsRevisionSelect", PostsRevisionSelect, {styles});


