import React from 'react';
import { Components, registerComponent, useMulti } from 'meteor/vulcan:core';
import withHover from '../common/withHover';
import { Link } from '../../lib/reactRouterWrapper.js';
import { TagRels } from '../../lib/collections/tagRels/collection.js';
import { useTagBySlug } from './useTag.jsx';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  card: {
    padding: 16,
    width: 600,
  },
  tagTitle: {
  },
});

const TagPreview = ({href, targetLocation, innerHTML, classes, hover, anchorEl}) => {
  const { params } = targetLocation;
  const { slug } = params;
  const { tag, loading: loadingTag } = useTagBySlug(slug);
  const { PopperCard, PostsItem2, Loading } = Components;
  
  const { results, loading: loadingPosts } = useMulti({
    skip: !(tag?._id),
    terms: {
      view: "postsWithTag",
      tagId: tag?._id,
    },
    collection: TagRels,
    queryName: "tagPageQuery",
    fragmentName: "TagRelFragment",
    limit: 4,
    ssr: true,
  });
  
  return <span>
    <PopperCard open={hover} anchorEl={anchorEl}>
      <div className={classes.card}>
        <h2 className={classes.tagTitle}>{tag?.name}</h2>
        {(loadingPosts || loadingTag) && <Loading/>}
        {results && results.map((result,i) =>
          <PostsItem2 key={result.post._id} post={result.post} index={i} />
        )}
        <Link to={`/tag/${slug}`}>See All</Link>
      </div>
    </PopperCard>
    <Link to={href} dangerouslySetInnerHTML={{__html: innerHTML}} />
  </span>;
}

registerComponent("TagPreview", TagPreview, withHover,
  withStyles(styles, {name: "TagPreview"}));
