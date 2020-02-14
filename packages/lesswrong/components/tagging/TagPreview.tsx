import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import { Link } from '../../lib/reactRouterWrapper';
import { TagRels } from '../../lib/collections/tagRels/collection';

const styles = theme => ({
  tagTitle: {
  },
  tagDescription: {
  },
});

const previewPostCount = 4;

const TagPreview = ({tag, classes}) => {
  const { ContentItemBody, PostsItem2, PostsListPlaceholder, SectionFooter } = Components;
  const { results } = useMulti({
    skip: !(tag?._id),
    terms: {
      view: "postsWithTag",
      tagId: tag?._id,
    },
    collection: TagRels,
    fragmentName: "TagRelFragment",
    limit: previewPostCount,
    ssr: true,
  });
  
  return (<div>
    <h2 className={classes.tagTitle}>{tag?.name}</h2>
    {tag && <ContentItemBody
      className={classes.tagDescription}
      dangerouslySetInnerHTML={{__html: tag.description?.htmlHighlight}}
      description={`tag ${tag.name}`}
    />}
    {!results && <PostsListPlaceholder count={previewPostCount}/>}
    {results && results.map((result,i) =>
      <PostsItem2 key={result.post._id} tagRel={result} post={result.post} index={i} />
    )}
    <SectionFooter>
      {tag && <Link to={`/tag/${tag.slug}`}>See All</Link>}
    </SectionFooter>
  </div>)
}

const TagPreviewComponent = registerComponent("TagPreview", TagPreview, {styles});

declare global {
  interface ComponentTypes {
    TagPreview: typeof TagPreviewComponent
  }
}

