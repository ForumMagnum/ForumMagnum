import React, { Fragment } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import { tagGetUrl } from '../../lib/collections/tags/helpers';
import { Link } from '../../lib/reactRouterWrapper';
import { tagPostTerms } from './TagPage';
import { taggingNameCapitalSetting, taggingNamePluralCapitalSetting, isEAForum } from '../../lib/instanceSettings';
import { getTagDescriptionHtml } from '../common/excerpts/TagExcerpt';
import { EA_HOVER_OVER_WIDTH } from '../ea-forum/EAHoverOver';
import classNames from 'classnames';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    paddingTop: 8,
    paddingLeft: 16,
    paddingRight: 16,
    ...(!isEAForum && {
      width: 500,
      paddingBottom: 6,
    }),
    [theme.breakpoints.down('xs')]: {
      width: "100%",
    }
  },
  rootEAWidth: {
    width: EA_HOVER_OVER_WIDTH,
  },
  relatedTagWrapper: {
    ...theme.typography.body2,
    ...theme.typography.postStyle,
    fontSize: "1.1rem",
    color: theme.palette.grey[900],
    display: '-webkit-box',
    "-webkit-line-clamp": 2,
    "-webkit-box-orient": 'vertical',
    overflow: 'hidden',
    ...(isEAForum && {
      fontFamily: theme.palette.fonts.sansSerifStack,
    }),
  },
  relatedTagLink : {
    color: theme.palette.lwTertiary.dark
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
  },
  footerCount: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    color: theme.palette.primary.main,
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 16,
    marginTop: 8,
  },
  footerMarginTop: {
    marginTop: 16,
  },
});

const TagPreview = ({
  tag,
  hash,
  showCount=true,
  hideRelatedTags,
  postCount=6,
  autoApplied=false,
  classes,
}: {
  tag: TagPreviewFragment | TagSectionPreviewFragment,
  hash?: string,
  showCount?: boolean,
  hideRelatedTags?: boolean,
  postCount?: number,
  autoApplied?: boolean,
  classes: ClassesType,
}) => {
  const showPosts = postCount > 0 && !!tag?._id && !isEAForum;
  const {results} = useMulti({
    skip: !showPosts,
    terms: tagPostTerms(tag, {}),
    collectionName: "Posts",
    fragmentName: "PostsList",
    limit: postCount,
  });

  // In theory the type system doesn't allow this, but I'm too scared to
  // remove it
  if (!tag) {
    return (
      <div className={classes.root} />
    );
  }

  const showRelatedTags =
    !isEAForum &&
    !hideRelatedTags &&
    !!(tag.parentTag || tag.subTags.length);

  const hasFooter = showCount || autoApplied;
  const subTagName = "Sub-" + (
    tag.subTags.length > 1
      ? taggingNamePluralCapitalSetting.get()
      : taggingNameCapitalSetting.get()
  );

  const hasDescription = !!getTagDescriptionHtml(tag);

  const {TagPreviewDescription, TagSmallPostLink, Loading} = Components;
  return (
    <div className={classNames(classes.root, {
      [classes.rootEAWidth]: isEAForum && hasDescription,
    })}>
      <TagPreviewDescription tag={tag} hash={hash} />
      {showRelatedTags &&
        <div className={classes.relatedTags}>
          {tag.parentTag &&
            <div className={classes.relatedTagWrapper}>
              Parent topic:{" "}
              <Link
                className={classes.relatedTagLink}
                to={tagGetUrl(tag.parentTag)}
              >
                {tag.parentTag.name}
              </Link>
            </div>
          }
          {tag.subTags.length
            ? (
              <div className={classes.relatedTagWrapper}>
                <span>
                  {subTagName}:&nbsp;{tag.subTags.map((subTag, idx) => (
                    <Fragment key={idx}>
                      <Link
                        className={classes.relatedTagLink}
                        to={tagGetUrl(subTag)}
                      >
                        {subTag.name}
                      </Link>
                      {idx < tag.subTags.length - 1 ? ", " : null}
                    </Fragment>
                  ))}
                </span>
              </div>
            )
            : null
          }
        </div>
      }
      {showPosts && !tag.wikiOnly &&
        <>
          {results
            ? (
              <div className={classes.posts}>
                {results.map((post) => post &&
                  <TagSmallPostLink
                    key={post._id}
                    post={post}
                    widerSpacing={postCount > 3}
                  />
                )}
              </div>
            )
            : <Loading />
          }
          {hasFooter &&
            <div className={classes.footer}>
              {autoApplied &&
                <span className={classes.autoApplied}>
                  Tag was auto-applied
                </span>
              }
              {showCount &&
                <span>
                  <Link to={tagGetUrl(tag)}>
                    View all {tag.postCount} posts
                  </Link>
                </span>
              }
            </div>
          }
        </>
      }
      {isEAForum &&
        <div className={classNames(classes.footerCount, {
          [classes.footerMarginTop]: hasDescription,
        })}>
          <Link to={tagGetUrl(tag)}>
            View all {tag.postCount} posts
          </Link>
        </div>
      }
    </div>
  );
}

const TagPreviewComponent = registerComponent("TagPreview", TagPreview, {styles});

declare global {
  interface ComponentTypes {
    TagPreview: typeof TagPreviewComponent
  }
}
