import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { Posts } from '../../lib/collections/posts';
import { useLocation } from '../../lib/routeUtil';
import { useSingle } from '../../lib/crud/withSingle';

const styles = theme => ({
});

const PostsCompareRevisions = ({ classes }: {
  classes: ClassesType
}) => {
  const { params, query } = useLocation();
  const postId = params._id;
  const versionBefore = query.before;
  const versionAfter = query.after;
  
  // Load the post, just for the title current
  const { document: postAfter, loading: loadingPost } = useSingle({
    documentId: postId,
    collection: Posts,
    fragmentName: "PostsBase",
  });
  
  const { SingleColumnSection, CompareRevisions, } = Components;
  
  return <SingleColumnSection>
    {postAfter && <h1>{postAfter.title}</h1>}
    
    <p>You are comparing revision {versionBefore} to revision {versionAfter}</p>
    
    <CompareRevisions
      collectionName="Posts" fieldName="contents"
      documentId={postId}
      versionBefore={versionBefore}
      versionAfter={versionAfter}
    />
    
  </SingleColumnSection>;
}

const PostsCompareRevisionsComponent = registerComponent("PostsCompareRevisions", PostsCompareRevisions, {styles});

declare global {
  interface ComponentTypes {
    PostsCompareRevisions: typeof PostsCompareRevisionsComponent
  }
}
