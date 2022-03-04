import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import maxBy from 'lodash/maxBy';
import { useMulti } from '../../lib/crud/withMulti';

const TopTagInner = ({ post, tag }: {post: PostsDetails, tag: TagPreviewFragment}) => {
  const { FooterTag } = Components
  const { results, loading } = useMulti({
    terms: {
      view: "tagsOnPost",
      postId: post._id,
    },
    collectionName: "TagRels",
    fragmentName: "TagRelMinimumFragment", // Must match the fragment in the mutation
    limit: 100,
  });

  let tagRel: TagRelMinimumFragment | null = null
  if(!loading && results.filter(tagRelResult => tagRelResult.tagId === tag._id).length > 0) {
    tagRel = results.filter(tagRelResult => tagRelResult.tagId === tag._id)[0]
  }
  return <FooterTag tag={tag} tagRel={tagRel || undefined} hideScore isTopTag/>
}

const PostsPageTopTag = ({post}: {post: PostsDetails}) => {
  // Fragment types have it typed as `any`. It is a map from tagId to the
  // relevance of the tag to the post
  const tagRels = post.tagRelevance as Record<string, number>
  const tags = post.tags
  const topTag = maxBy(tags.filter(tag => tag.core), tag => tagRels[tag._id])
  if (!topTag) { return null }
  return <TopTagInner post={post} tag={topTag} />
}

const PostsPageTopTagComponent = registerComponent("PostsPageTopTag", PostsPageTopTag);

declare global {
  interface ComponentTypes {
    PostsPageTopTag: typeof PostsPageTopTagComponent
  }
}
