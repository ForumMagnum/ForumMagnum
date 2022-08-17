import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import { tagGetUrl } from '../../lib/collections/tags/helpers';
import { Link } from '../../lib/reactRouterWrapper';
import { tagPostTerms } from './TagPage';
import { taggingNameCapitalSetting, taggingNamePluralCapitalSetting } from '../../lib/instanceSettings';

const styles = (theme: ThemeType): JssStyles => ({
  relatedTag: {
    display: "flex",
    ...theme.typography.body2,
    ...theme.typography.postStyle,
    fontSize: "1.1rem",
    color: theme.palette.grey[900],
  },
  relatedTagLink : {
    color: theme.palette.lwTertiary.dark
  },
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
  footerCount: {
    borderTop: theme.palette.border.extraFaint,
    paddingTop: 6,
    textAlign: "right",
    ...theme.typography.smallFont,
    ...theme.typography.commentStyle,
    color: theme.palette.lwTertiary.main,
    marginTop: 6,
    marginBottom: 2
  },
  posts: {
    marginTop: 10,
    paddingTop: 8,
    borderTop: theme.palette.border.extraFaint,
    marginBottom: 8
  },
  relatedTags: {
    marginTop: 12,
    paddingTop: 8,
    borderTop: theme.palette.border.extraFaint,
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
      {(tag.parentTag || tag.subTags.length) ?
        <div className={classes.relatedTags}>
          {tag.parentTag && <div className={classes.relatedTag}>Parent topic:&nbsp;<Link className={classes.relatedTagLink} to={tagGetUrl(tag.parentTag)}>{tag.parentTag.name}</Link></div>}
          {tag.subTags.length ? <div className={classes.relatedTag}><span>Sub-{tag.subTags.length > 1 ? taggingNamePluralCapitalSetting.get() : taggingNameCapitalSetting.get()}:&nbsp;{tag.subTags.map((subTag, idx) => {
            return <><Link key={idx} className={classes.relatedTagLink} to={tagGetUrl(subTag)}>{subTag.name}</Link>{idx < tag.subTags.length - 1 ? <>,&nbsp;</>: <></>}</>
          })}</span></div> : <></>}
        </div> : <></>
      }
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
