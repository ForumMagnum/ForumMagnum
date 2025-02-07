import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useLocation } from '../../lib/routeUtil';
import { useSingle } from '../../lib/crud/withSingle';
import { styles } from './PostsPage/PostsPage';
import { useMulti } from '@/lib/crud/withMulti';

const PostsCompareRevisions = ({ classes }: {
  classes: ClassesType<typeof styles>
}) => {
  const { CompareRevisions, PostsPagePostHeader, RevisionComparisonNotice, LoadingOrErrorPage, ErrorPage } = Components;
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
    return <LoadingOrErrorPage found={!!post} loading={loadingPost} error={postError} />
  }
  if (!revisionResults) {
    return <LoadingOrErrorPage found={!!revisionResults} loading={loadingRevision} error={revisionError} />
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

const PostsCompareRevisionsComponent = registerComponent("PostsCompareRevisions", PostsCompareRevisions, {styles});

declare global {
  interface ComponentTypes {
    PostsCompareRevisions: typeof PostsCompareRevisionsComponent
  }
}
