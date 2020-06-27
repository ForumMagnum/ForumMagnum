import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import { Tags } from '../../lib/collections/tags/collection';
import { TagRels } from '../../lib/collections/tagRels/collection';
import { commentBodyStyles } from '../../themes/stylePiping'
import { Link } from '../../lib/reactRouterWrapper';

const styles = theme => ({
  card: {
    paddingTop: 8,
    paddingLeft: 16,
    paddingRight: 16,
    paddingBottom: 6,
    width: 600,
    [theme.breakpoints.down('xs')]: {
      width: "100%",
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
  },
  footerCount: {
    textAlign: "right",
    ...theme.typography.smallFont,
    ...theme.typography.commentStyle,
    color: theme.palette.primary.main,
    marginTop: 6,
    marginBottom: 2,
    marginRight: 6
  },
  smallPost: {
    ...theme.typography.commentStyle,
    ...theme.typography.smallText,
    color: theme.palette.grey[600]
  }
});

const previewPostCount = 3;

const TagPreview = ({tag, classes, showCount=true}: {
  tag: TagPreviewFragment,
  classes: ClassesType,
  showCount?: boolean
}) => {
  const { TagPreviewDescription, PostsItem2, PostsListPlaceholder } = Components;
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

  return (<div className={classes.card}>
    <TagPreviewDescription tag={tag}/>
    {!results && <PostsListPlaceholder count={previewPostCount} />}
    {results && results.map((result,i) =>
      <PostsItem2 key={result.post._id} post={result.post} index={i} showBottomBorder={showCount || i!=2}/>
    )}
    {/* {!showPosts && results && results.map((result, i) => {
      return <span key={result.post._id} className={classes.smallPost}>{result.post.title}, </span>
    })} */}
    {showCount && <div className={classes.footerCount}>
      <Link to={Tags.getUrl(tag)}>{tag.postCount} posts</Link>
    </div>}
  </div>)
}

const TagPreviewComponent = registerComponent("TagPreview", TagPreview, {styles});

declare global {
  interface ComponentTypes {
    TagPreview: typeof TagPreviewComponent
  }
}
