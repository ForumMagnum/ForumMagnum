import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useLocation } from '../../lib/routeUtil';
import { useSingle } from '../../lib/crud/withSingle';
import { styles } from './PostsPage/PostsPage';
import { useMulti } from '@/lib/crud/withMulti';
import { CompareRevisions } from "../revisions/CompareRevisions";
import { PostsPagePostHeader } from "./PostsPage/PostsPagePostHeader";
import { RevisionComparisonNotice } from "../revisions/RevisionComparisonNotice";
import { LoadingOrErrorPage } from "../common/LoadingOrErrorPage";
import { ErrorPage } from "../common/ErrorPage";

const PostsCompareRevisionsInner = ({ classes }: {
  classes: ClassesType<typeof styles>
}) => {
  const { params, query } = useLocation();
  const postId = params._id;
  const versionBefore = query.before;
  const versionAfter = query.after;
  
  // Load the post, just for the current title
  const { document: post, loading: loadingPost, error: postError } = useSingle({
    documentId: postId,
    collectionName: "Posts",
    fragmentName: "PostsWithNavigation",
    extraVariables: { sequenceId: 'String' },
    extraVariablesValues: { sequenceId: null },
  });
  
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

export const PostsCompareRevisions = registerComponent("PostsCompareRevisions", PostsCompareRevisionsInner, {styles});

declare global {
  interface ComponentTypes {
    PostsCompareRevisions: typeof PostsCompareRevisions
  }
}
