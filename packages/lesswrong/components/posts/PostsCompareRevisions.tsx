import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useLocation } from '../../lib/routeUtil';
import { useSingle } from '../../lib/crud/withSingle';
import { styles } from './PostsPage/PostsPage';

const PostsCompareRevisions = ({ classes }: {
  classes: ClassesType<typeof styles>
}) => {
  const { params, query } = useLocation();
  const postId = params._id;
  const versionBefore = query.before;
  const versionAfter = query.after;
  
  // Load the post, just for the current title
  const { document: post, loading: loadingPost } = useSingle({
    documentId: postId,
    collectionName: "Posts",
    fragmentName: "PostsWithNavigation",
    extraVariables: { sequenceId: 'String' },
    extraVariablesValues: { sequenceId: null },
  });
  
  const { CompareRevisions, PostsPagePostHeader, RevisionComparisonNotice, Loading } = Components;
  if (loadingPost || !post) return <Loading/>
  
  return <div className={classes.centralColumn}>
    <PostsPagePostHeader post={post}/>
    
    <RevisionComparisonNotice before={versionBefore} after={versionAfter} />
    
    <div className={classes.postContent}>
      <CompareRevisions
        collectionName="Posts" fieldName="contents"
        documentId={postId}
        versionBefore={versionBefore}
        versionAfter={versionAfter}
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
