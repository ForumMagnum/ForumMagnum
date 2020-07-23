import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib';
import { useSingle } from '../../lib/crud/withSingle';
import { Posts } from '../../lib/collections/posts';
import { Tags } from '../../lib/collections/tags/collection';

const OwnPostTaggedEmail = ({postId, tagId}:{postId: string, tagId: string}) => {
  const { document: post, loading: loadingPost } = useSingle({
    documentId: postId,
    collection: Posts,
    fragmentName: "PostsRevision",
  });
  const { document: tag, loading: loadingTag } = useSingle({
    documentId: tagId,
    collection: Tags,
    fragmentName: "TagPreviewFragment" 
  })
  if (loadingPost || loadingTag) return null;
  
  const postLink = Posts.getPageUrl(post, true);
  const tagLink = Tags.getUrl(tag)
  
  return <div>
    <p>
      Your post <a href={postLink}>{post.title}</a> was tagged <a href={tagLink}>{tag.name}</a>.
    </p>
  </div>
}

const OwnPostTaggedEmailComponent = registerComponent("OwnPostTaggedEmail", OwnPostTaggedEmail);

declare global {
  interface ComponentTypes {
    OwnPostTaggedEmail: typeof OwnPostTaggedEmailComponent
  }
}
