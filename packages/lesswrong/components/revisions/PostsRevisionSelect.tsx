import React, { useCallback } from 'react'
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useLocation, useNavigation } from '../../lib/routeUtil';
import { useSingle } from '../../lib/crud/withSingle';
import { useMulti } from '../../lib/crud/withMulti';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';

const styles = (theme: ThemeType): JssStyles => ({
  revisionList: {
  },
});

const PostsRevisionSelect = ({ classes }: {
  classes: ClassesType
}) => {
  const { SingleColumnSection, RevisionSelect, Loading } = Components;
  const { params } = useLocation();
  const { history } = useNavigation();
  const postId = params._id;
  
  const { document: post, loading: loadingPost } = useSingle({
    documentId: postId,
    collectionName: "Posts",
    fragmentName: "PostsDetails",
  });
  const { results: revisions, loading: loadingRevisions, loadMoreProps } = useMulti({
    skip: !post,
    terms: {
      view: "revisionsOnDocument",
      documentId: post?._id,
      fieldName: "contents",
    },
    fetchPolicy: "cache-then-network" as any,
    collectionName: "Revisions",
    fragmentName: "RevisionMetadataWithChangeMetrics",
  });
  
  const compareRevs = useCallback(({before,after}: {before: RevisionMetadata, after: RevisionMetadata}) => {
    if (!post) return;
    history.push(`/compare/post/${post._id}/${post.slug}?before=${before.version}&after=${after.version}`);
  }, [post, history]);

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

const PostsRevisionSelectComponent = registerComponent("PostsRevisionSelect", PostsRevisionSelect, {styles});

declare global {
  interface ComponentTypes {
    PostsRevisionSelect: typeof PostsRevisionSelectComponent
  }
}
