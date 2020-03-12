import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import { Link } from '../../lib/reactRouterWrapper';
import { TagRels } from '../../lib/collections/tagRels/collection';
import { highlightStyles } from '../posts/PostsPreviewTooltip';
import { seeAllStyles } from './TagRelCard';

const styles = theme => ({
  tagTitle: {
  },
  tagDescription: {
    ...highlightStyles(theme)
  },
  seeAll: {
    ...seeAllStyles(theme)
  }
});

const previewPostCount = 4;

const TagPreview = ({tag, classes}: {
  tag: TagFragment,
  classes: ClassesType,
}) => {
  const { ContentItemBody, PostsItem2, PostsListPlaceholder } = Components;
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
    <h2 className={classes.tagTitle}>{tag?.name} Tag</h2>
    {tag && <ContentItemBody
      className={classes.tagDescription}
      dangerouslySetInnerHTML={{__html: tag.description?.htmlHighlight}}
      description={`tag ${tag.name}`}
    />}
    {!results && <PostsListPlaceholder count={previewPostCount}/>}
    {results && results.map((result,i) =>
      <PostsItem2 key={result.post._id} post={result.post} index={i} />
    )}
    {tag && <Link className={classes.seeAll} to={`/tag/${tag.slug}`}>See All</Link>}
  </div>)
}

const TagPreviewComponent = registerComponent("TagPreview", TagPreview, {styles});

declare global {
  interface ComponentTypes {
    TagPreview: typeof TagPreviewComponent
  }
}

