import React from "react";
import { Components } from "@/lib/vulcan-lib";
import { isFriendlyUI } from "@/themes/forumTheme";
import { HEADER_HEIGHT } from "../common/Header";
import { MAX_COLUMN_WIDTH } from "../posts/PostsPage/PostsPage";


export const tagPageHeaderStyles = (theme: ThemeType) => ({
  postListMeta: {
    display: "flex",
    alignItems: "baseline",
    marginBottom: 8,
  },
  relevance: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    color: theme.palette.grey[600],
    fontWeight: 500,
    textAlign: "right",
    flexGrow: 1,
    marginRight: 8,
  },
});

// Also used in TagCompareRevisions, TagDiscussionPage
export const styles = (theme: ThemeType): JssStyles => ({
  rootGivenImage: {
    marginTop: 185,
    [theme.breakpoints.down('sm')]: {
      marginTop: 130,
    },
  },
  imageContainer: {
    width: '100%',
    '& > picture > img': {
      height: 300,
      objectFit: 'cover',
      width: '100%',
    },
    position: 'absolute',
    top: HEADER_HEIGHT,
    [theme.breakpoints.down('sm')]: {
      width: 'unset',
      '& > picture > img': {
        height: 200,
        width: '100%',
      },
      left: -4,
      right: -4,
    },
  },
  centralColumn: {
    marginLeft: "auto",
    marginRight: "auto",
    maxWidth: MAX_COLUMN_WIDTH,
  },
  header: {
    paddingTop: 19,
    paddingBottom: 5,
    paddingLeft: 42,
    paddingRight: 42,
    background: theme.palette.panelBackground.default,
    borderTopLeftRadius: theme.borderRadius.default,
    borderTopRightRadius: theme.borderRadius.default,
  },
  titleRow: {
    [theme.breakpoints.up('sm')]: {
      display: 'flex',
      justifyContent: 'space-between',
    }
  },
  title: {
    ...theme.typography[isFriendlyUI ? "display2" : "display3"],
    ...theme.typography[isFriendlyUI ? "headerStyle" : "commentStyle"],
    marginTop: 0,
    fontWeight: isFriendlyUI ? 700 : 600,
    ...theme.typography.smallCaps,
  },
  notifyMeButton: {
    [theme.breakpoints.down('xs')]: {
      marginTop: 6,
    },
  },
  nonMobileButtonRow: {
    [theme.breakpoints.down('xs')]: {
      // Ensure this takes priority over the properties in TagPageButtonRow
      display: 'none !important',
    },
  },
  mobileButtonRow: {
    [theme.breakpoints.up('sm')]: {
      display: 'none !important',
    },
  },
  editMenu: {
    [theme.breakpoints.down('xs')]: {
      marginTop: 16,
      marginBottom: 8,
    },
  },
  wikiSection: {
    paddingTop: 5,
    paddingLeft: 42,
    paddingRight: 42,
    paddingBottom: 12,
    marginBottom: 24,
    background: theme.palette.panelBackground.default,
    borderBottomLeftRadius: theme.borderRadius.default,
    borderBottomRightRadius: theme.borderRadius.default,
  },
  subHeading: {
    paddingLeft: 42,
    paddingRight: 42,
    marginTop: -2,
    background: theme.palette.panelBackground.default,
    ...theme.typography.body2,
    ...theme.typography.postStyle,
  },
  subHeadingInner: {
    paddingTop: 2,
    paddingBottom: 2,
    borderTop: theme.palette.border.extraFaint,
    borderBottom: theme.palette.border.extraFaint,
  },
  relatedTag : {
    display: '-webkit-box',
    "-webkit-line-clamp": 2,
    "-webkit-box-orient": 'vertical',
    overflow: 'hidden',
    fontFamily: isFriendlyUI ? theme.palette.fonts.sansSerifStack : undefined,
  },
  relatedTagLink : {
    color: theme.palette.lwTertiary.dark
  },
  tagHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 8,
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
  },
  postsTaggedTitle: {
    color: theme.palette.grey[600]
  },
  pastRevisionNotice: {
    ...theme.typography.commentStyle,
    fontStyle: 'italic'
  },
  nextLink: {
    ...theme.typography.commentStyle
  },
  ...tagPageHeaderStyles(theme),
});

export const tagPostTerms = (tag: Pick<TagBasicInfo, "_id" | "name"> | null, query: any) => {
  if (!tag) return
  return ({
    ...query,
    filterSettings: {tags:[{tagId: tag._id, tagName: tag.name, filterMode: "Required"}]},
    view: "tagRelevance",
    tagId: tag._id,
  })
}

export const RelevanceLabel = () => (
  <Components.LWTooltip
    title='"Relevance" represents how related the tag is to the post it is tagging. You can vote on relevance below, or by hovering over tags on post pages.'
    placement="bottom-end"
  >
    Relevance
  </Components.LWTooltip>
);