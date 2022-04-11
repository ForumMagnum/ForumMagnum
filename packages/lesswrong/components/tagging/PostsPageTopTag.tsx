import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import maxBy from 'lodash/maxBy';
import { useMulti } from '../../lib/crud/withMulti';
import { forumTypeSetting } from '../../lib/instanceSettings';

/** Inner component used so that we can run a query here, which would have been
 * a conditional hook otherwise */
const TopTagInner = ({ post, tag }: {post: PostsDetails, tag: TagPreviewFragment}) => {
  const { FooterTag } = Components
  const { results, loading } = useMulti({
    terms: {
      view: "tagsOnPost",
      postId: post._id,
    },
    collectionName: "TagRels",
    fragmentName: "TagRelMinimumFragment",
    limit: 100,
  });

  let tagRel: TagRelMinimumFragment | null = null
  if(!loading && results.filter(tagRelResult => tagRelResult.tagId === tag._id).length > 0) {
    tagRel = results.filter(tagRelResult => tagRelResult.tagId === tag._id)[0]
  }
  return <FooterTag tag={tag} tagRel={tagRel || undefined} hideScore isTopTag />
}

// Sometimes you have tags that are core but not the type you want to advertize
const TOP_TAG_REJECTS = ['community']

const PostsPageTopTag = ({post}: {post: PostsDetails}) => {
  if (forumTypeSetting.get() !== "EAForum") return null
  // Fragment types have it typed as `any`. It is a map from tagId to the
  // relevance of the tag to the post
  const tagRels = post.tagRelevance as Record<string, number>
  const tags = post.tags
  const topTag = maxBy(tags.filter(tag => tag.core), tag => tagRels[tag._id])
  if (!topTag || TOP_TAG_REJECTS.includes(topTag.slug)) { return null }
  return <TopTagInner post={post} tag={topTag} />
}

const PostsPageTopTagComponent = registerComponent("PostsPageTopTag", PostsPageTopTag);

declare global {
  interface ComponentTypes {
    PostsPageTopTag: typeof PostsPageTopTagComponent
  }
}
