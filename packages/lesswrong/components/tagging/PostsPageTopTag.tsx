import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import maxBy from 'lodash/maxBy';

const PostsPageTopTag = ({post}: {post: PostsDetails}) => {
  const { FooterTag } = Components
  // Fragment types have it typed as `any`. It is a map from tagId to the
  // relevance of the tag to the post
  const tagRels = post.tagRelevance as Record<string, number>
  const tags = post.tags
  const topTag = maxBy(tags.filter(tag => tag.core), tag => tagRels[tag._id])
  if (!topTag) { return null }
  // TODO; add tagRel
  return <FooterTag tag={topTag} hideScore isTopTag/>
}

const PostsPageTopTagComponent = registerComponent("PostsPageTopTag", PostsPageTopTag);

declare global {
  interface ComponentTypes {
    PostsPageTopTag: typeof PostsPageTopTagComponent
  }
}
