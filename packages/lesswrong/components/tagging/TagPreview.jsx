import React from 'react';
import { Components, registerComponent, useMulti } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';
import { Link } from '../../lib/reactRouterWrapper.js';
import { TagRels } from '../../lib/collections/tagRels/collection.js';

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
    queryName: "tagPreviewQuery",
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

registerComponent("TagPreview", TagPreview,
  withStyles(styles, {name: "TagPreview"}));
