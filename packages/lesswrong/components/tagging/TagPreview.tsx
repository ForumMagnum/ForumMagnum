import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import { Link } from '../../lib/reactRouterWrapper';
import { TagRels } from '../../lib/collections/tagRels/collection';
import { commentBodyStyles } from '../../themes/stylePiping'
import { seeAllStyles } from './TagRelCard';
import { truncate } from '../../lib/editor/ellipsize';

const styles = theme => ({
  tagTitle: {
  },
  tagDescription: {
    marginTop: theme.spacing.unit,
    ...commentBodyStyles(theme)
  },
  title: {
    ...commentBodyStyles(theme),
    ...theme.typography.display0,
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

  if (!tag) return null
  const highlight = truncate(tag.description?.htmlHighlight, 1, "paragraphs")

  return (<div>
    {tag.description?.htmlHighlight ? <ContentItemBody
      className={classes.tagDescription}
      dangerouslySetInnerHTML={{__html: highlight}}
      description={`tag ${tag.name}`}
    /> : <h2 className={classes.title}>{tag.name}</h2 >
    }
    {!results && <PostsListPlaceholder count={previewPostCount}/>}
    {results && results.map((result,i) =>
      <PostsItem2 key={result.post._id} post={result.post} index={i} />
    )}
    <Link className={classes.seeAll} to={`/tag/${tag.slug}`}>See All</Link>
  </div>)
}

const TagPreviewComponent = registerComponent("TagPreview", TagPreview, {styles});

declare global {
  interface ComponentTypes {
    TagPreview: typeof TagPreviewComponent
  }
}
