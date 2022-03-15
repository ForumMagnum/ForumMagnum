import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import { tagGetUrl } from '../../lib/collections/tags/helpers';
import { commentBodyStyles } from '../../themes/stylePiping'
import { Link } from '../../lib/reactRouterWrapper';
import { tagPostTerms } from './TagPage';

const styles = (theme: ThemeType): JssStyles => ({
  card: {
    paddingTop: 8,
    paddingLeft: 16,
    paddingRight: 16,
    paddingBottom: 6,
    width: 500,
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
    borderTop: "solid 1px rgba(0,0,0,.08)",
    paddingTop: 6,
    textAlign: "right",
    ...theme.typography.smallFont,
    ...theme.typography.commentStyle,
    color: theme.palette.lwTertiary.main,
    marginTop: 6,
    marginBottom: 2
  },
  posts: {
    marginTop: 12,
    paddingTop: 8,
    borderTop: "solid 1px rgba(0,0,0,.08)",
    marginBottom: 8
  }
});

const TagPreview = ({tag, loading, classes, showCount=true, postCount=6}: {
  tag: TagPreviewFragment | null,
  loading?: boolean,
  classes: ClassesType,
  showCount?: boolean,
  postCount?: number,
}) => {
  const { TagPreviewDescription, TagSmallPostLink, Loading } = Components;
  const { results } = useMulti({
    skip: !(tag?._id),
    terms: tagPostTerms(tag, {}),
    collectionName: "Posts",
    fragmentName: "PostsList",
    limit: postCount,
  });
  
  // I kinda want the type system to forbid this, but the obvious union approach
  // didn't work
  if (!loading && !tag) {
    return null
  }
  
  return (<div className={classes.card}>
    {loading && <Loading />}
    {tag && <>
      <TagPreviewDescription tag={tag}/>
      {!tag.wikiOnly && <>
        {results ? <div className={classes.posts}>
          {results.map((post,i) => post && <TagSmallPostLink key={post._id} post={post} widerSpacing={postCount > 3} />)}
        </div> : <Loading /> }
        {showCount && <div className={classes.footerCount}>
          <Link to={tagGetUrl(tag)}>View all {tag.postCount} posts</Link>
        </div>}
      </>}
    </>}
  </div>)
}

const TagPreviewComponent = registerComponent("TagPreview", TagPreview, {styles});

declare global {
  interface ComponentTypes {
    TagPreview: typeof TagPreviewComponent
  }
}
