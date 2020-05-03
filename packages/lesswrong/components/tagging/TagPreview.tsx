import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import { TagRels } from '../../lib/collections/tagRels/collection';
import { commentBodyStyles } from '../../themes/stylePiping'
import { truncate } from '../../lib/editor/ellipsize';

const styles = theme => ({
  card: {
    paddingTop: 8,
    paddingLeft: 16,
    paddingRight: 16,
    paddingBottom: 6,
    width: 600,
    [theme.breakpoints.down('xs')]: {
      width: "calc(100% - 32px)",
    }
  },
  tagDescription: {
    ...commentBodyStyles(theme)
  },
  relevance: {
    marginBottom: 12,
    ...theme.typography.body2,
    ...theme.typography.commentStyle
  },
  relevanceLabel: {
    marginRight: 8,
    color: theme.palette.grey[600]
  },
  score: {
    marginLeft: 4,
    marginRight: 4,
  }
});

const previewPostCount = 3;

const TagPreview = ({tag, classes}: {
  tag: TagPreviewFragment,
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
  const highlight = truncate(tag.description?.htmlHighlight, 1, "paragraphs", "")

  return (<div className={classes.card}>
    {tag.description?.htmlHighlight ? <ContentItemBody
      className={classes.tagDescription}
      dangerouslySetInnerHTML={{__html: highlight}}
      description={`tag ${tag.name}`}
    /> : <div className={classes.tagDescription}><b>{tag.name}</b></div>
    }
    {!results && <PostsListPlaceholder count={previewPostCount} />}
    {results && results.map((result,i) =>
      <PostsItem2 key={result.post._id} post={result.post} index={i} showBottomBorder={i!=2}/>
    )}
  </div>)
}

const TagPreviewComponent = registerComponent("TagPreview", TagPreview, {styles});

declare global {
  interface ComponentTypes {
    TagPreview: typeof TagPreviewComponent
  }
}
