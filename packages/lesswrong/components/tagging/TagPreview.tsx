import React, { Fragment } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import { tagGetUrl } from '../../lib/collections/tags/helpers';
import { Link } from '../../lib/reactRouterWrapper';
import { tagPostTerms } from './TagPage';
import { taggingNameCapitalSetting, taggingNamePluralCapitalSetting } from '../../lib/instanceSettings';
import { isFriendlyUI } from '../../themes/forumTheme';

const styles = (theme: ThemeType): JssStyles => ({
  relatedTagWrapper: {
    ...theme.typography.body2,
    ...theme.typography.postStyle,
    fontFamily: isFriendlyUI ? theme.palette.fonts.sansSerifStack : undefined,
    fontSize: "1.1rem",
    color: theme.palette.grey[900],
    display: '-webkit-box',
    "-webkit-line-clamp": 2,
    "-webkit-box-orient": 'vertical',
    overflow: 'hidden',
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
  footer: {
    borderTop: theme.palette.border.extraFaint,
    paddingTop: 6,
    display: "flex",
    ...theme.typography.smallFont,
    ...theme.typography.commentStyle,
    color: theme.palette.lwTertiary.main,
    marginTop: 6,
    marginBottom: 2
  },
  autoApplied: {
    flexGrow: 1,
  },
  footerCount: {
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

export type TagPreviewProps = {
  tag: TagPreviewFragment | TagSectionPreviewFragment | null,
  loading?: boolean,
  classes: ClassesType,
  showCount?: boolean,
  showRelatedTags?: boolean,
  postCount?: number,
  autoApplied?: boolean,
  hash?: string,
}

const TagPreview = ({tag, loading, classes, showCount=true, showRelatedTags=true, postCount=6, autoApplied=false, hash}: TagPreviewProps) => {
  const { TagPreviewDescription, TagSmallPostLink, Loading } = Components;
  const showPosts = postCount > 0 && !!(tag?._id)
  const { results, loading: tagPostsLoading } = useMulti({
    skip: !showPosts,
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
  
  const hasFooter = (showCount || autoApplied);
  
  return (<div className={classes.card}>
    {loading && <Loading />}
    {tag && <>
      <TagPreviewDescription tag={tag} hash={hash}/>
      {showRelatedTags && (tag.parentTag || tag.subTags.length) ?
        <div className={classes.relatedTags}>
          {tag.parentTag && <div className={classes.relatedTagWrapper}>Parent topic:&nbsp;<Link className={classes.relatedTagLink} to={tagGetUrl(tag.parentTag)}>{tag.parentTag.name}</Link></div>}
          {tag.subTags.length ? <div className={classes.relatedTagWrapper}><span>Sub-{tag.subTags.length > 1 ? taggingNamePluralCapitalSetting.get() : taggingNameCapitalSetting.get()}:&nbsp;{tag.subTags.map((subTag, idx) => {
            return <Fragment key={idx}>
              <Link className={classes.relatedTagLink} to={tagGetUrl(subTag)}>{subTag.name}</Link>{idx < tag.subTags.length - 1 ? <>,&nbsp;</>: <></>}
            </Fragment>
          })}</span></div> : <></>}
        </div> : <></>
      }
      {showPosts && !tag.wikiOnly && <>
        {results ? <div className={classes.posts}>
          {results.map((post,i) => post && <TagSmallPostLink key={post._id} post={post} widerSpacing={postCount > 3} />)}
        </div> : <Loading />}
        {hasFooter && <div className={classes.footer}>
          {autoApplied && <span className={classes.autoApplied}>
            Tag was auto-applied
          </span>}
          {showCount && <span className={classes.footerCount}>
            <Link to={tagGetUrl(tag)}>View all {tag.postCount} posts</Link>
          </span>}
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
