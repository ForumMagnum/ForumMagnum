import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useLocation } from '../../lib/routeUtil';
import { styles } from './PostsPage/PostsPage';
import { useMulti } from '@/lib/crud/withMulti';
import { useQuery } from "@apollo/client";
import { gql } from "@/lib/generated/gql-codegen/gql";
import CompareRevisions from "../revisions/CompareRevisions";
import PostsPagePostHeader from "./PostsPage/PostsPagePostHeader";
import RevisionComparisonNotice from "../revisions/RevisionComparisonNotice";
import LoadingOrErrorPage from "../common/LoadingOrErrorPage";
import ErrorPage from "../common/ErrorPage";

const PostsWithNavigationQuery = gql(`
  query PostsCompareRevisions($documentId: String, $sequenceId: String) {
    post(input: { selector: { documentId: $documentId } }) {
      result {
        ...PostsWithNavigation
      }
    }
  }
`);

const PostsCompareRevisions = ({ classes }: {
  classes: ClassesType<typeof styles>
}) => {
  const { params, query } = useLocation();
  const postId = params._id;
  const versionBefore = query.before;
  const versionAfter = query.after;
  
  // Load the post, just for the current title
  const { loading: loadingPost, error: postError, data } = useQuery(PostsWithNavigationQuery, {
    variables: { documentId: postId, sequenceId: null },
  });
  const post = data?.post?.result;
  
  // Load the after- revision
  const { results: revisionResults, loading: loadingRevision, error: revisionError } = useMulti({
    collectionName: "Revisions",
    fragmentName: "RevisionHistoryEntry",
    terms: {
      view: "revisionByVersionNumber",
      documentId: postId,
      version: versionAfter,
    },
    skip: !versionAfter,
  });
  
  if (!post) {
    return <LoadingOrErrorPage loading={loadingPost} error={postError} />
  }
  if (!revisionResults) {
    return <LoadingOrErrorPage loading={loadingRevision} error={revisionError} />
  }
  if (!revisionResults.length) {
    return <ErrorPage error="Revision not found or you do not have access"/>
  }

  const revision = revisionResults[0];
  
  return <div className={classes.centralColumn}>
    <PostsPagePostHeader post={post}/>
    
    <RevisionComparisonNotice before={versionBefore} after={versionAfter} />
    
    <div className={classes.postContent}>
      <CompareRevisions
        collectionName="Posts" fieldName="contents"
        documentId={postId}
        versionBefore={versionBefore}
        versionAfter={versionAfter}
        revisionAfter={revision}
      />
    </div>
  </div>;
}

export default registerComponent("PostsCompareRevisions", PostsCompareRevisions, {styles});


