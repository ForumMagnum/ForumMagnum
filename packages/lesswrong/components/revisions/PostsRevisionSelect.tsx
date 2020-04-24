import React, { useCallback } from 'react'
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useLocation, useNavigation } from '../../lib/routeUtil';
import { useSingle } from '../../lib/crud/withSingle';
import { Posts } from '../../lib/collections/posts';
import { Link } from '../../lib/reactRouterWrapper';

const styles = theme => ({
  revisionList: {
  },
});

const PostsRevisionSelect = ({ classes }: {
  classes: ClassesType
}) => {
  const { SingleColumnSection, FormatDate, RevisionSelect, Loading } = Components;
  const { params } = useLocation();
  const { history } = useNavigation();
  const postId = params._id;
  
  const { document: post, loading } = useSingle({
    documentId: postId,
    collection: Posts,
    fragmentName: "PostsDetailsAndRevisionsList",
  });
  
  const compareRevs = useCallback(({before,after}: {before: RevisionMetadata, after: RevisionMetadata}) => {
    if (!post) return;
    history.push(`/compare/post/${post._id}/${post.slug}?before=${before.version}&after=${after.version}`);
  }, [post, history]);
  
  return <SingleColumnSection>
    {loading && <Loading/>}
    
    <h1>{post && post.title}</h1>
    
    <div className={classes.revisionList}>
      {post && <RevisionSelect
        revisions={post.revisions}
        describeRevision={(rev: RevisionMetadata) => (
          <Link to={`${Posts.getPageUrl(post)}?revision=${rev.version}`}>
            {rev.version}{" "}
            <FormatDate format={"LLL z"} date={rev.editedAt}/>
          </Link>
        )}
        onPairSelected={compareRevs}
      />}
    </div>
  </SingleColumnSection>
}

const PostsRevisionSelectComponent = registerComponent("PostsRevisionSelect", PostsRevisionSelect, {styles});

declare global {
  interface ComponentTypes {
    PostsRevisionSelectComponent: typeof PostsRevisionSelect
  }
}
