import React, { Fragment, useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import { tagGetUrl } from '../../lib/collections/tags/helpers';
import { Link } from '../../lib/reactRouterWrapper';
import { tagPostTerms } from './TagPageUtils';
import { taggingNameCapitalSetting, taggingNamePluralCapitalSetting } from '../../lib/instanceSettings';
import { getTagDescriptionHtml } from '../common/excerpts/TagExcerpt';
import { FRIENDLY_HOVER_OVER_WIDTH } from '../common/FriendlyHoverOver';
import { isFriendlyUI } from '../../themes/forumTheme';
import classNames from 'classnames';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { getTagDescriptionHtmlHighlight } from './TagPreviewDescription';
import startCase from 'lodash/startCase';
import { htmlToTextDefault } from '@/lib/htmlToText';

const styles = defineStyles('TagPreview', (theme: ThemeType) => ({
  root: {
    ...(isFriendlyUI ? {
      paddingTop: 8,
      paddingLeft: 16,
      paddingRight: 16,
    } : {
      width: 500,
      paddingBottom: 8,
    }),
    [theme.breakpoints.down('xs')]: {
      width: "100%",
    }
  },
  rootEAWidth: {
    width: FRIENDLY_HOVER_OVER_WIDTH,
  },
  mainContent: {
    ...(!isFriendlyUI && {
      paddingLeft: 16,
      paddingRight: 16,
      maxHeight: 600,
      overflowY: 'auto',
    }),
  },
  title: {
    ...theme.typography.commentStyle,
    fontSize: "1.2rem",
    color: theme.palette.grey[900],
    fontWeight: 600,
    paddingLeft: 16,
    paddingRight: 16,
    paddingTop: 12,
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
  postsWithoutDescription: {
    paddingTop: 8,
    marginBottom: 8,
    overflow: "hidden",
  },
  postsWithDescription: {
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
      backgroundColor: theme.palette.panelBackground.default,
      borderBottom: `1px solid ${theme.palette.panelBackground.default}`,
      marginBottom: -1,
      borderLeft: `1px solid ${theme.palette.greyAlpha(0.1)}`,
      borderRight: `1px solid ${theme.palette.greyAlpha(0.1)}`,
    },
    '&:first-of-type[data-selected="true"]': {
      borderLeft: 'none',
    },
  },
  description: {
    ...(!isFriendlyUI && { marginTop: 16 }),
  },
}));

function tagNameIsBoldedAnywhere(html: string, rawTagName: string): boolean {
  const normalizedTagName = rawTagName.toLowerCase().replace(/[^\w\s]/g, '');
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const boldTags = doc.querySelectorAll('b, strong');

  for (const el of Array.from(boldTags)) {
    const textContent = el.textContent?.toLowerCase().replace(/[^\w\s]/g, '');
    if (textContent?.includes(normalizedTagName)) {
      return true;
    }
  }
  return false;
}

/*
/* If the text displayed on hover preview doesn't contain the tag name bolded, we use this flag to display a title.
/* If summaries are present, we must check for the tag name in the first summary, otherwise we use the tag name 
/* from the main description.
*/
const tagShowTitle = (tag: (TagPreviewFragment | TagSectionPreviewFragment) & { summaries?: MultiDocumentContentDisplay[] }) => {
  if (isFriendlyUI) {
    return false;
  }

  const tooltipText = tag.summaries?.[0]?.contents?.html ?? getTagDescriptionHtmlHighlight(tag);
  if (!tooltipText) {
    return true;
  }

  return !tagNameIsBoldedAnywhere(tooltipText, tag.name);
};

const TagPreview = ({
  tag,
  hash,
  showCount=true,
  hideRelatedTags,
  hideDescription=false,
  postCount=6,
  autoApplied=false,
  setForceOpen,
}: {
  tag: (TagPreviewFragment | TagSectionPreviewFragment) & { summaries?: MultiDocumentContentDisplay[] },
  hash?: string,
  showCount?: boolean,
  hideRelatedTags?: boolean,
  hideDescription?: boolean,
  postCount?: number,
  autoApplied?: boolean,
  setForceOpen?: (forceOpen: boolean) => void,
}) => {
  const classes = useStyles(styles);

  const [activeTab, setActiveTab] = useState<number>(0);

  // Because different tabs can have different heights due to varying content lengths,
  // we need to keep the tooltip open when switching tabs, so that switching from a taller tab
  // to a shorter tab with certain placements doesn't cause the tooltip to close automatically
  // when the cursor is no longer hovering over the tab.
  const updateActiveTab = (index: number) => {
    setActiveTab(index);
    setForceOpen?.(true);
  };

  const showPosts = postCount > 0 && !!tag?._id && !isFriendlyUI;
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

  const summaryTabs = tag.summaries?.map((summary, index) => (
    <div 
      key={summary.tabTitle}
      className={classes.summaryTab}
      data-selected={activeTab === index}
      onClick={() => updateActiveTab(index)}
    >
      {startCase(summary.tabTitle)}
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
  const hasMultipleSummaries = summaryTabs.length > 1;

  const { TagPreviewDescription, TagSmallPostLink, Loading } = Components;
  return (
    <div className={classNames(classes.root, {
      [classes.rootEAWidth]: isFriendlyUI && hasDescription,
    })}>
      {hasMultipleSummaries && <div className={classes.tabsContainer}>
       {summaryTabs}
      </div>}
      <TagPreviewTitle tag={tag} />
      <div className={classes.mainContent}>
        {hasDescription && <div className={classes.description}>
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
                <div className={hasDescription ? classes.postsWithDescription : classes.postsWithoutDescription}>
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

const TagPreviewTitle = ({tag}: {
  tag: (TagPreviewFragment | TagSectionPreviewFragment) & { summaries?: MultiDocumentContentDisplay[] },
}) => {
  const classes = useStyles(styles);
  
  if (!tagShowTitle(tag)) {
    return null;
  }

  // TODO Add comment count and like count
  return <div className={classNames(classes.title)}>
    {tag.name}
  </div>
}

const TagPreviewComponent = registerComponent("TagPreview", TagPreview);

export default TagPreviewComponent;

declare global {
  interface ComponentTypes {
    TagPreview: typeof TagPreviewComponent
  }
}
