import React, { Fragment, useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import { tagGetUrl } from '../../lib/collections/tags/helpers';
import { Link } from '../../lib/reactRouterWrapper';
import { tagPostTerms } from './TagPageExports';
import { taggingNameCapitalSetting, taggingNamePluralCapitalSetting } from '../../lib/instanceSettings';
import { getTagDescriptionHtml } from '../common/excerpts/TagExcerpt';
import { FRIENDLY_HOVER_OVER_WIDTH } from '../common/FriendlyHoverOver';
import { isFriendlyUI } from '../../themes/forumTheme';
import classNames from 'classnames';
import { defineStyles, useStyles } from '../hooks/useStyles';

const styles = defineStyles('TagPreview', (theme: ThemeType) => ({
  root: {
    ...(!isFriendlyUI && {
      width: 500,
      paddingBottom: 6,
    }),
    [theme.breakpoints.down('xs')]: {
      width: "100%",
    }
  },
  rootEAWidth: {
    width: FRIENDLY_HOVER_OVER_WIDTH,
  },
  nonArbitalPadding: {
    paddingLeft: 16,
    paddingRight: 16,
  },
  nonTabPadding: {
    // paddingTop: 16,
    paddingLeft: 16,
    paddingRight: 16,
    maxHeight: 400,
    overflowY: 'auto',
  },
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
  footer: {
    borderTop: theme.palette.border.extraFaint,
    paddingTop: 6,
    display: "flex",
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
    marginBottom: 8,
    overflow: "hidden",
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
  arbitalTitle: {
    fontSize: "1.5rem",
    marginBottom: 16,
    color: theme.palette.link.color,
  },
  tabsContainer: {
    display: "flex",
    flexDirection: "row",
    borderBottom: `1px solid ${theme.palette.greyAlpha(0.1)}`,
    backgroundColor: theme.palette.panelBackground.postsItemHover,
  },
  summaryTab: {
    padding: "8px 14px",
    fontSize: "1.2em",
    color: theme.palette.greyAlpha(1),
    cursor: 'pointer !important',
    '&[data-selected="true"]': {
      backgroundColor: 'white',
      borderBottom: "1px solid white",
      marginBottom: -1,
      borderLeft: `1px solid ${theme.palette.greyAlpha(0.1)}`,
      borderRight: `1px solid ${theme.palette.greyAlpha(0.1)}`,
    },
    '&:first-of-type[data-selected="true"]': {
      borderLeft: 'none',
    },
  },
  descriptionTop: {
    // marginTop: 16,
  },
}));

const TagPreview = ({
  tag,
  hash,
  showCount=true,
  hideRelatedTags,
  hideDescription=false,
  postCount=6,
  autoApplied=false,
}: {
  tag: (TagPreviewFragment | TagSectionPreviewFragment) & { summaries?: MultiDocumentEdit[] },
  hash?: string,
  showCount?: boolean,
  hideRelatedTags?: boolean,
  hideDescription?: boolean,
  postCount?: number,
  autoApplied?: boolean,
}) => {
  const [activeTab, setActiveTab] = useState<number>(0);

  const showPosts = postCount > 0 && !!tag?._id && !isFriendlyUI;
  const {results} = useMulti({
    skip: !showPosts,
    terms: tagPostTerms(tag, {}),
    collectionName: "Posts",
    fragmentName: "PostsList",
    limit: postCount,
  });

  const classes = useStyles(styles);

  const summaries = tag?.summaries;
  const multipleSummaries = summaries && summaries.length > 1;

  // In theory the type system doesn't allow this, but I'm too scared to
  // remove it
  if (!tag) {
    return (
      <div className={classes.root} />
    );
  }

  const summaryTabs = tag.summaries?.map((summary, index) => (
    <div 
      key={summary.tabTitle}
      className={classes.summaryTab}
      data-selected={activeTab === index}
      onClick={() => setActiveTab(index)}
    >
      {summary.tabTitle}
    </div>
  )) ?? [];

  const showRelatedTags =
    !isFriendlyUI &&
    !hideRelatedTags &&
    !!(tag.parentTag || tag.subTags.length);

  const hasFooter = showCount || autoApplied;
  const subTagName = "Sub-" + (
    tag.subTags.length > 1
      ? taggingNamePluralCapitalSetting.get()
      : taggingNameCapitalSetting.get()
  );

  const hasDescription = !!getTagDescriptionHtml(tag) && !hideDescription;

  const { TagPreviewDescription, TagSmallPostLink, Loading } = Components;
  return (
    <div className={classNames(classes.root, {
      [classes.rootEAWidth]: isFriendlyUI && hasDescription,
    })}>
      {multipleSummaries && <div className={classes.tabsContainer}>
       {summaryTabs}
      </div>}
      <div className={classes.nonTabPadding}>
        {hasDescription && <div className={classes.descriptionTop}>
          <TagPreviewDescription 
            tag={tag} 
            hash={hash} 
            {...(tag.summaries?.length ? { activeTab } : {})}
          />
        </div>}
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
        {isFriendlyUI &&
          <div className={classNames(classes.footerCount, {
            [classes.footerMarginTop]: hasDescription,
          })}>
            <Link to={tagGetUrl(tag)}>
              View all {tag.postCount} posts
            </Link>
          </div>
        }
      </div>
    </div>
  );
}

const TagPreviewComponent = registerComponent("TagPreview", TagPreview);

export default TagPreviewComponent;

declare global {
  interface ComponentTypes {
    TagPreview: typeof TagPreviewComponent
  }
}
