import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { Posts } from '../../lib/collections/posts';
import { useLocation } from '../../lib/routeUtil';
import { useSingle } from '../../lib/crud/withSingle';
import { useQuery } from 'react-apollo';
import gql from 'graphql-tag';

const styles = theme => ({
  differences: {
    "& ins": {
      background: "#88ff88",
      textDecoration: "none",
    },
    "& del": {
      background: "#ff8888",
      textDecoration: "none",
    },
  },
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
  
  // Use the RevisionsDiff resolver to get a comparison between revisions (see
  // packages/lesswrong/server/resolvers/diffResolvers.ts).
  const { data: diffResult, loading: loadingDiff, error } = useQuery(gql`
    query RevisionsDiff($collectionName: String, $fieldName: String, $id: String, $beforeRev: String, $afterRev: String) {
      RevisionsDiff(collectionName: $collectionName, fieldName: $fieldName, id: $id, beforeRev: $beforeRev, afterRev: $afterRev)
    }
  `, {
    variables: {
      collectionName: "Posts",
      fieldName: "contents",
      id: postId,
      beforeRev: versionBefore,
      afterRev: versionAfter,
    },
    ssr: true,
  });
  
  if (error) {
    return <Components.ErrorMessage message={error.message}/>
  }
  
  const diffResultHtml = diffResult?.RevisionsDiff;
  
  const { SingleColumnSection, Loading, ContentItemBody } = Components;
  
  return <SingleColumnSection>
    {postAfter && <h1>{postAfter.title}</h1>}
    
    <p>You are comparing revision {versionBefore} to revision {versionAfter}</p>
    
    <div className={classes.differences}>
      {loadingDiff && <Loading/>}
      {diffResultHtml && <ContentItemBody dangerouslySetInnerHTML={{__html: diffResultHtml}}/>}
    </div>
  </SingleColumnSection>;
}

const PostsCompareRevisionsComponent = registerComponent("PostsCompareRevisions", PostsCompareRevisions, {styles});

declare global {
  interface ComponentTypes {
    PostsCompareRevisions: typeof PostsCompareRevisionsComponent
  }
}
