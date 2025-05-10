import React, { useCallback } from 'react'
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useSingle } from '../../lib/crud/withSingle';
import { useMulti } from '../../lib/crud/withMulti';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import { useLocation, useNavigate } from "../../lib/routeUtil";
import { SingleColumnSection } from "../common/SingleColumnSection";
import { RevisionSelect } from "./RevisionSelect";
import { Loading } from "../vulcan-core/Loading";

const styles = (theme: ThemeType) => ({
  revisionList: {
  },
});

const PostsRevisionSelectInner = ({ classes }: {
  classes: ClassesType<typeof styles>
}) => {
  const { params } = useLocation();
  const navigate = useNavigate();
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

export const PostsRevisionSelect = registerComponent("PostsRevisionSelect", PostsRevisionSelectInner, {styles});


