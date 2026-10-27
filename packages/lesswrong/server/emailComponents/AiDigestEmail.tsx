import React from "react";
import classNames from "classnames";
import { defineStyles } from "@/components/hooks/defineStyles";
import { gql } from "@/lib/generated/gql-codegen";
import type { CommentTreeNode } from "@/lib/utils/unflatten";
import type {
  AiDigestEmailComment,
  AiDigestEmailPost,
} from "@/lib/generated/gql-codegen/graphql";
import { postGetPageUrl } from "@/lib/collections/posts/helpers";
import {
  buildAiDigestPreview as buildPreview,
  formatAiDigestDate as formatDate,
  formatAiDigestPostAuthors as formatPostAuthors,
  truncateAiDigestText as truncateText,
  type DigestContentLookup,
  itemKey,
  postReadMoreLabel,
  getCommentUrl,
  threadTitle,
  discussionCommentMaxLength,
  aiDigestContentIds,
  aiDigestDiscussionThread,
} from "@/lib/aiDigest/aiDigestDisplay";
import { aiDigestPresentation } from "@/lib/aiDigest/aiDigestPresentation";
import { cloudinaryCloudName } from "@/lib/instanceSettings";
import type { JssStyles } from "@/lib/jssStyles";
import { getSiteUrl } from "@/lib/vulcan-lib/utils";
import { cheerioParse } from "@/server/utils/htmlUtil";
import { emailUseQuery } from "@/server/vulcan-lib/query";
import { aiDigestChromeLinkUrl, aiDigestItemLinkUrl, type AiDigestLinkSlot } from "./aiDigestEmailLinks";
import { EmailContentItemBody } from "./EmailContentItemBody";
import { EmailContextType, emailUseStyles } from "./emailContext";

const emailSansFont =
  'Calibri, "Gill Sans", "Gill Sans MT", "Myriad Pro", Myriad, "Liberation Sans", Tahoma, Geneva, "Helvetica Neue", Helvetica, Arial, sans-serif';
const emailTitleFont =
  'ETBookRoman, warnock-pro, Palatino, "Palatino Linotype", "Book Antiqua", Georgia, serif';
const emailSerifFont =
  'warnock-pro, Palatino, "Palatino Linotype", "Book Antiqua", Georgia, serif';
const emailAiBlockFont =
  '"cronos-pro", "Trebuchet MS", Calibri, "Gill Sans", "Gill Sans MT", "Helvetica Neue", Arial, sans-serif';
const mastheadHomeUrl = "/";
const mastheadUnsubscribeUrl = "/account?tab=settings-notifications";

// Tighter spacing for narrow screens, in email clients that support media
// queries. Juice inlines the base styles onto each element, so every override
// here must carry !important to beat the inlined value.
const emailMobileBreakpoint = "@media screen and (max-width: 600px)";

// Outlook and plain text drop inline margins, so a space separates adjacent
// inline items and the margin tops that space up.
const separatorSpaceWidth = 4;

// Gmail and Outlook drop inline SVG, so the icons are PNGs served from
// /public. The compass carries a halo in the page background color, which
// keeps it visible when a client darkens the background but not the image.
const compassRoseIconSize = 28;
const tuneIconSize = 15;
const headlineImageWidth = 544;

function aiDigestEmailAssetUrl(siteUrl: string, fileName: string): string {
  return `${siteUrl}aiDigestEmail/${fileName}`;
}

const cloudinaryUploadUrlPattern = new RegExp(
  `^(https://res\\.cloudinary\\.com/${cloudinaryCloudName}/image/upload/)(?:[a-z]{1,3}_[^/]*/)*(.+)$`,
);

// Cropping on Cloudinary keeps images undistorted in clients that ignore
// object-fit, such as classic Outlook.
function croppedEmailImageUrl(imageUrl: string, width: number, height: number): string {
  const match = cloudinaryUploadUrlPattern.exec(imageUrl);
  if (!match) {
    return imageUrl;
  }
  const [, uploadUrl, assetPath] = match;
  return `${uploadUrl}c_fill,g_auto,w_${width * 2},h_${height * 2},f_auto,q_auto/${assetPath}`;
}

// Email clients hide media unevenly (Outlook ignores display:none on images),
// and footnote markers link to footnotes that the preview doesn't include.
const emailPreviewRemovedElements = "img, picture, svg, iframe, video, audio, object, embed, .footnote-reference, .footnote-ref";

function emailPreviewHtml(previewHtml: string): string {
  const parsedHtml = cheerioParse(previewHtml);
  parsedHtml(emailPreviewRemovedElements).remove();
  return parsedHtml.html();
}

const AiDigestEmailPostsQuery = gql(`
  query AiDigestEmailPosts($postIds: [String!]) {
    posts(
      selector: { default: { exactPostIds: $postIds } }
      limit: 20
      enableTotal: false
    ) {
      results {
        ...AiDigestEmailPost
      }
    }
  }

`);

const AiDigestEmailCommentsQuery = gql(`
  query AiDigestEmailComments($commentIds: [String!]) {
    comments(
      selector: { default: { commentIds: $commentIds } }
      limit: 20
      enableTotal: false
    ) {
      results {
        ...AiDigestEmailComment
      }
    }
  }

`);

// Mutes links so a preview reads as running text rather than as a second card
// inside the card.
function previewBodyStyles({ margin, fontSize, mobileFontSize, lineHeight }: {
  margin: string;
  fontSize: number;
  mobileFontSize: number;
  lineHeight: number;
}) {
  const blockStyles = {
    margin,
    color: "#333333",
    fontFamily: emailSerifFont,
    fontSize,
    lineHeight,
    [emailMobileBreakpoint]: {
      fontSize: `${mobileFontSize}px !important`,
    },
  };
  return {
    ...blockStyles,
    "& p": blockStyles,
    "& p:last-child": {
      marginBottom: 0,
    },
    "& blockquote": {
      ...blockStyles,
      padding: "0 0 0 12px",
      borderLeft: "2px solid #ded7c8",
      fontStyle: "italic",
    },
    "& a": {
      color: blockStyles.color,
      textDecoration: "none",
    },
  };
}

const styles = defineStyles("AiDigestEmail", () => ({
  preheader: {
    display: "none",
    maxHeight: 0,
    overflow: "hidden",
    fontSize: 1,
    lineHeight: "1px",
    color: "#f5f0e7",
    msoHide: "all",
  },
  shell: {
    width: "100%",
    backgroundColor: "#f5f0e7",
    color: "#1a1a1a",
    fontFamily: emailSansFont,
  },
  shellCell: {
    padding: "28px 28px 40px",
    [emailMobileBreakpoint]: {
      padding: "18px 6px 30px !important",
    },
  },
  masthead: {
    width: "100%",
    borderTop: "4px solid #53633f",
  },
  mastheadCompassCell: {
    width: 34,
    padding: "13px 6px 0 0",
    verticalAlign: "top",
  },
  mastheadNameCell: {
    padding: "14px 0 0",
    verticalAlign: "top",
  },
  mastheadCompassLink: {
    display: "block",
    color: "#1a1a1a",
    textDecoration: "none",
  },
  mastheadCompassIcon: {
    display: "block",
    width: compassRoseIconSize,
    height: compassRoseIconSize,
    border: 0,
  },
  wordmark: {
    color: "#1a1a1a",
    display: "block",
    fontFamily: emailTitleFont,
    fontSize: 24,
    fontWeight: 600,
    letterSpacing: "-0.2px",
    lineHeight: 1.1,
    textDecoration: "none",
    [emailMobileBreakpoint]: {
      fontSize: "21px !important",
    },
  },
  mastheadProductName: {
    marginTop: 3,
    color: "#53633f",
    fontFamily: emailSansFont,
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "1.8px",
    lineHeight: 1.2,
    textTransform: "uppercase",
  },
  mastheadUnsubscribeCell: {
    width: 88,
    padding: "14px 0 0 10px",
    textAlign: "right",
    verticalAlign: "middle",
  },
  mastheadUnsubscribeLink: {
    color: "#8a8a8a",
    fontFamily: emailSansFont,
    fontSize: 14,
    textDecoration: "none",
  },
  aiNote: {
    width: "100%",
    marginTop: aiDigestPresentation.aiNote.marginTop,
  },
  aiNoteCell: {
    backgroundColor: "#e5eadc",
    borderRadius: aiDigestPresentation.aiNote.borderRadius,
    padding: aiDigestPresentation.aiNote.padding,
    [emailMobileBreakpoint]: {
      padding: "15px 7px 16px !important",
    },
  },
  aiNoteLabel: {
    marginBottom: aiDigestPresentation.aiNote.labelMarginBottom,
    color: "#596650",
    fontFamily: emailSansFont,
    fontSize: aiDigestPresentation.aiNote.labelFontSize,
    fontWeight: aiDigestPresentation.aiNote.labelFontWeight,
    letterSpacing: aiDigestPresentation.aiNote.labelLetterSpacing,
    lineHeight: aiDigestPresentation.aiNote.labelLineHeight,
    textTransform: "uppercase",
  },
  aiNoteParagraph: {
    margin: aiDigestPresentation.aiNote.paragraphMargin,
    color: "#333333",
    fontFamily: emailAiBlockFont,
    fontSize: aiDigestPresentation.aiNote.paragraphFontSize,
    lineHeight: aiDigestPresentation.aiNote.paragraphLineHeight,
    [emailMobileBreakpoint]: {
      fontSize: "14px !important",
    },
  },
  aiNoteFirstParagraph: {
    marginTop: 0,
  },
  aiNoteFooter: {
    width: "100%",
    marginTop: aiDigestPresentation.aiNote.footerMarginTop,
  },
  aiNoteFooterLeftCell: {
    verticalAlign: "baseline",
  },
  aiNoteFooterRightCell: {
    paddingLeft: 12,
    textAlign: "right",
    verticalAlign: "baseline",
  },
  aiNoteTuneLink: {
    display: "inline-block",
    color: "#5f9b65",
    fontFamily: emailSansFont,
    fontSize: 13,
    fontWeight: 600,
    textDecoration: "none",
  },
  aiNoteExplanationLink: {
    color: "#8a9179",
    fontFamily: emailSansFont,
    fontSize: 12,
    textDecoration: "none",
    whiteSpace: "nowrap",
  },
  tuneIcon: {
    display: "inline-block",
    width: tuneIconSize,
    height: tuneIconSize,
    verticalAlign: "-3px",
    border: 0,
  },
  customPrompt: {
    width: "100%",
    marginTop: 14,
  },
  customPromptCell: {
    backgroundColor: "#e9e4d9",
    borderRadius: 6,
    padding: "15px 20px 16px",
    [emailMobileBreakpoint]: {
      padding: "13px 7px 14px !important",
    },
  },
  customPromptLabel: {
    marginBottom: 6,
    color: "#8a8577",
    fontFamily: emailSansFont,
    fontSize: aiDigestPresentation.aiNote.labelFontSize,
    fontWeight: aiDigestPresentation.aiNote.labelFontWeight,
    letterSpacing: aiDigestPresentation.aiNote.labelLetterSpacing,
    lineHeight: aiDigestPresentation.aiNote.labelLineHeight,
    textTransform: "uppercase",
  },
  customPromptText: {
    color: "#4d4a43",
    fontFamily: emailSansFont,
    fontSize: 13,
    fontStyle: "italic",
    lineHeight: 1.55,
    whiteSpace: "pre-wrap",
  },
  tuneIconWithLabel: {
    marginRight: 6 - separatorSpaceWidth,
  },
  section: {
    width: "100%",
    marginTop: aiDigestPresentation.section.marginTop,
    [emailMobileBreakpoint]: {
      marginTop: "28px !important",
    },
  },
  sectionHeadingCell: {
    paddingBottom: 0,
  },
  sectionTitle: {
    margin: 0,
    color: "#1a1a1a",
    fontFamily: emailTitleFont,
    fontSize: aiDigestPresentation.section.titleFontSize,
    fontWeight: aiDigestPresentation.section.titleFontWeight,
    lineHeight: aiDigestPresentation.section.titleLineHeight,
    [emailMobileBreakpoint]: {
      fontSize: "19px !important",
    },
  },
  itemCell: {
    paddingTop: aiDigestPresentation.section.itemSpacing,
    [emailMobileBreakpoint]: {
      paddingTop: "18px !important",
    },
  },
  headlineCard: {
    width: "100%",
    backgroundColor: "#fffdf9",
    borderRadius: aiDigestPresentation.card.borderRadius,
  },
  headlineImage: {
    display: "block",
    width: "100%",
    height: aiDigestPresentation.headline.imageHeight,
    objectFit: "cover",
    border: 0,
    borderRadius: `${aiDigestPresentation.card.borderRadius}px ${aiDigestPresentation.card.borderRadius}px 0 0`,
    [emailMobileBreakpoint]: {
      height: "180px !important",
    },
  },
  headlineBody: {
    padding: aiDigestPresentation.headline.bodyPadding,
    [emailMobileBreakpoint]: {
      padding: "16px 7px 12px !important",
    },
  },
  headlineTitle: {
    margin: aiDigestPresentation.headline.titleMargin,
    color: "#1a1a1a",
    fontFamily: emailTitleFont,
    fontSize: aiDigestPresentation.headline.titleFontSize,
    fontWeight: aiDigestPresentation.headline.titleFontWeight,
    letterSpacing: aiDigestPresentation.headline.titleLetterSpacing,
    lineHeight: aiDigestPresentation.headline.titleLineHeight,
    [emailMobileBreakpoint]: {
      fontSize: "19px !important",
    },
  },
  titleLink: {
    color: "#1a1a1a",
    textDecoration: "none",
  },
  metadata: {
    marginBottom: aiDigestPresentation.headline.metadataMarginBottom,
    color: "#8a8a8a",
    fontFamily: emailSansFont,
    fontSize: aiDigestPresentation.headline.metadataFontSize,
    lineHeight: aiDigestPresentation.headline.metadataLineHeight,
    [emailMobileBreakpoint]: {
      fontSize: "12px !important",
    },
  },
  metadataLink: {
    color: "#8a8a8a",
    textDecoration: "none",
  },
  textLink: {
    color: "inherit",
    textDecoration: "none",
  },
  excerpt: {
    margin: aiDigestPresentation.headline.excerptMargin,
    color: "#333333",
    fontFamily: emailSerifFont,
    fontSize: aiDigestPresentation.headline.excerptFontSize,
    lineHeight: aiDigestPresentation.headline.excerptLineHeight,
    [emailMobileBreakpoint]: {
      fontSize: "15px !important",
    },
  },
  previewBody: previewBodyStyles({
    margin: aiDigestPresentation.headline.excerptMargin,
    fontSize: aiDigestPresentation.headline.excerptFontSize,
    mobileFontSize: 15,
    lineHeight: aiDigestPresentation.headline.excerptLineHeight,
  }),
  readLink: {
    color: "#5f9b65",
    fontFamily: emailSansFont,
    fontSize: aiDigestPresentation.footer.readLinkFontSize,
    textDecoration: "none",
    whiteSpace: "nowrap",
    [emailMobileBreakpoint]: {
      fontSize: "13px !important",
    },
  },
  compactCard: {
    width: "100%",
    backgroundColor: "#fffdf9",
    borderRadius: aiDigestPresentation.card.borderRadius,
  },
  compactTextCell: {
    padding: aiDigestPresentation.compact.textPadding,
    verticalAlign: "top",
    [emailMobileBreakpoint]: {
      padding: "13px 6px 6px 7px !important",
    },
  },
  compactImageCell: {
    width: aiDigestPresentation.compact.imageWidth,
    padding: aiDigestPresentation.compact.imagePadding,
    verticalAlign: "top",
    [emailMobileBreakpoint]: {
      width: "96px !important",
      padding: "13px 7px 6px 0 !important",
    },
  },
  compactImage: {
    display: "block",
    width: aiDigestPresentation.compact.imageWidth,
    height: aiDigestPresentation.compact.imageHeight,
    objectFit: "cover",
    border: 0,
    borderRadius: aiDigestPresentation.compact.imageBorderRadius,
    [emailMobileBreakpoint]: {
      width: "96px !important",
      height: "65px !important",
    },
  },
  compactTitle: {
    margin: aiDigestPresentation.compact.titleMargin,
    color: "#1a1a1a",
    fontFamily: emailTitleFont,
    fontSize: aiDigestPresentation.compact.titleFontSize,
    fontWeight: aiDigestPresentation.compact.titleFontWeight,
    lineHeight: aiDigestPresentation.compact.titleLineHeight,
    [emailMobileBreakpoint]: {
      fontSize: "16px !important",
    },
  },
  compactByline: {
    display: "block",
    marginBottom: aiDigestPresentation.compact.metadataMarginBottom,
    color: "#8a8a8a",
    fontFamily: emailSansFont,
    fontSize: aiDigestPresentation.compact.metadataFontSize,
    fontWeight: 400,
    textDecoration: "none",
    [emailMobileBreakpoint]: {
      fontSize: "12px !important",
    },
  },
  compactExcerpt: {
    margin: aiDigestPresentation.compact.excerptMargin,
    color: "#333333",
    fontFamily: emailSerifFont,
    fontSize: aiDigestPresentation.compact.excerptFontSize,
    lineHeight: aiDigestPresentation.compact.excerptLineHeight,
    [emailMobileBreakpoint]: {
      fontSize: "13px !important",
    },
  },
  compactPreviewBody: previewBodyStyles({
    margin: aiDigestPresentation.compact.excerptMargin,
    fontSize: aiDigestPresentation.compact.excerptFontSize,
    mobileFontSize: 13,
    lineHeight: aiDigestPresentation.compact.excerptLineHeight,
  }),
  quickTakeCard: {
    width: "100%",
    backgroundColor: "#fffdf9",
    borderRadius: aiDigestPresentation.card.borderRadius,
  },
  quickTakeBody: {
    padding: aiDigestPresentation.quickTake.bodyPadding,
    [emailMobileBreakpoint]: {
      padding: "12px 6px 10px !important",
    },
  },
  quickTakeLabel: {
    padding: aiDigestPresentation.quickTake.labelPadding,
    borderRadius: aiDigestPresentation.quickTake.labelBorderRadius,
    backgroundColor: "#e5eadc",
    color: "#647259",
    fontFamily: emailSansFont,
    fontSize: aiDigestPresentation.quickTake.labelFontSize,
    fontWeight: aiDigestPresentation.quickTake.labelFontWeight,
    lineHeight: aiDigestPresentation.quickTake.labelLineHeight,
    whiteSpace: "nowrap",
  },
  quickTakeMeta: {
    width: "100%",
    marginBottom: aiDigestPresentation.quickTake.metaMarginBottom,
  },
  quickTakeAuthorCell: {
    verticalAlign: "middle",
  },
  quickTakeLabelCell: {
    width: "1%",
    paddingLeft: 12,
    verticalAlign: "middle",
  },
  quickTakeAuthor: {
    color: "#1a1a1a",
    fontFamily: emailSansFont,
    fontSize: aiDigestPresentation.quickTake.authorFontSize,
    fontWeight: aiDigestPresentation.quickTake.authorFontWeight,
  },
  quickTakeDate: {
    color: "#8a8a8a",
    fontFamily: emailSansFont,
    fontSize: aiDigestPresentation.quickTake.dateFontSize,
    fontWeight: 400,
    marginLeft: aiDigestPresentation.quickTake.dateMarginLeft - separatorSpaceWidth,
  },
  quickTakeLink: {
    display: "block",
    color: "inherit",
    textDecoration: "none",
  },
  quickTakeText: {
    margin: aiDigestPresentation.quickTake.textMargin,
    color: "#333333",
    fontFamily: emailSansFont,
    fontSize: aiDigestPresentation.quickTake.textFontSize,
    lineHeight: aiDigestPresentation.quickTake.textLineHeight,
  },
  discussionCard: {
    width: "100%",
    backgroundColor: "#fffdf9",
    borderRadius: aiDigestPresentation.card.borderRadius,
  },
  discussionBody: {
    padding: aiDigestPresentation.discussion.bodyPadding,
    [emailMobileBreakpoint]: {
      padding: "14px 6px 16px !important",
    },
  },
  discussionThreadTitle: {
    margin: aiDigestPresentation.discussion.threadTitleMargin,
    color: "#4d4a43",
    fontFamily: emailSerifFont,
    fontSize: aiDigestPresentation.discussion.threadTitleFontSize,
    fontStyle: "italic",
    fontWeight: aiDigestPresentation.discussion.threadTitleFontWeight,
    lineHeight: aiDigestPresentation.discussion.titleLineHeight,
  },
  discussionThreadTitleLink: {
    color: "#4d4a43",
    textDecoration: "none",
  },
  discussionThreadTitleSubject: {
    fontWeight: aiDigestPresentation.discussion.threadTitleSubjectFontWeight,
  },
  // Border colors are rgba(72,94,144,0.16) flattened onto each box's
  // background, since classic Outlook doesn't support rgba.
  commentBox: {
    width: "100%",
    border: "1px solid #e2e5ed",
    borderRadius: aiDigestPresentation.discussion.commentBorderRadius,
  },
  commentContent: {
    padding: aiDigestPresentation.discussion.commentPadding,
  },
  commentBoxRoot: {
    margin: aiDigestPresentation.discussion.commentMargin,
    backgroundColor: "#ffffff",
  },
  commentReplyCell: {
    padding: aiDigestPresentation.discussion.replyMargin,
    [emailMobileBreakpoint]: {
      paddingLeft: "5px !important",
      paddingBottom: "5px !important",
    },
  },
  commentBoxReply: {
    borderRight: "none",
    borderRadius: aiDigestPresentation.discussion.replyBorderRadius,
  },
  commentBoxOdd: {
    backgroundColor: "#fcfcfc",
    borderColor: "#dfe3eb",
  },
  commentBoxEven: {
    backgroundColor: "#f2f2f2",
    borderColor: "#d7dae2",
  },
  commentByline: {
    marginBottom: aiDigestPresentation.discussion.bylineMarginBottom,
    color: "#1a1a1a",
    fontFamily: emailSansFont,
    fontSize: aiDigestPresentation.discussion.bylineFontSize,
    fontWeight: aiDigestPresentation.discussion.bylineFontWeight,
  },
  commentBylineDate: {
    color: "#8a8a8a",
    fontFamily: emailSansFont,
    fontSize: aiDigestPresentation.discussion.dateFontSize,
    fontWeight: 400,
    marginLeft: aiDigestPresentation.discussion.dateMarginLeft - separatorSpaceWidth,
  },
  commentText: {
    color: "#333333",
    fontFamily: emailSansFont,
    fontSize: aiDigestPresentation.discussion.textFontSize,
    lineHeight: aiDigestPresentation.discussion.textLineHeight,
  },
  commentLink: {
    display: "block",
    color: "inherit",
    textDecoration: "none",
  },
  footerRow: {
    width: "100%",
  },
  footerCell: {
    borderTop: "1px solid #efe9dc",
    paddingTop: aiDigestPresentation.footer.paddingTop,
  },
  footerLayout: {
    width: "100%",
  },
  // A table rather than flexbox, which Gmail only partly supports. Both cells
  // set a pixel line height so that client defaults can't shift either
  // baseline.
  footerReadMoreCell: {
    width: "1%",
    fontFamily: emailSansFont,
    fontSize: aiDigestPresentation.footer.readLinkFontSize,
    lineHeight: `${aiDigestPresentation.footer.lineHeight}px`,
    verticalAlign: "baseline",
    whiteSpace: "nowrap",
    [emailMobileBreakpoint]: {
      display: "block !important",
      width: "auto !important",
    },
  },
  footerReasonCell: {
    paddingLeft: aiDigestPresentation.footer.columnGap,
    fontFamily: emailSansFont,
    fontSize: aiDigestPresentation.footer.readLinkFontSize,
    lineHeight: `${aiDigestPresentation.footer.lineHeight}px`,
    textAlign: "right",
    textWrap: "balance",
    verticalAlign: "baseline",
    [emailMobileBreakpoint]: {
      display: "block !important",
      paddingLeft: "0 !important",
      paddingTop: `${aiDigestPresentation.footer.rowGap}px !important`,
      textAlign: "left !important",
    },
  },
  footerReason: {
    color: "#9a958a",
    fontFamily: emailSansFont,
    fontSize: aiDigestPresentation.footer.reasonFontSize,
    fontStyle: "italic",
  },
  compactFooterCell: {
    padding: aiDigestPresentation.compact.footerPadding,
    [emailMobileBreakpoint]: {
      padding: "0 7px 12px !important",
    },
  },
  curatedHeading: {
    width: "100%",
  },
  curatedHeadingLabelCell: {
    color: "#8a8577",
    fontFamily: emailSansFont,
    fontSize: aiDigestPresentation.curated.labelFontSize,
    fontWeight: aiDigestPresentation.curated.labelFontWeight,
    letterSpacing: aiDigestPresentation.curated.labelLetterSpacing,
    lineHeight: aiDigestPresentation.curated.labelLineHeight,
    paddingRight: aiDigestPresentation.curated.labelPaddingRight,
    textTransform: "uppercase",
    whiteSpace: "nowrap",
  },
  curatedHeadingRuleCell: {
    lineHeight: 1,
    verticalAlign: "middle",
    width: "100%",
  },
  curatedHeadingRule: {
    borderTop: "1px solid #d8d1c0",
    fontSize: 0,
    lineHeight: 0,
    width: "100%",
  },
  quietItemFirstCell: {
    paddingTop: aiDigestPresentation.curated.firstItemPaddingTop,
  },
  quietItemCell: {
    paddingTop: aiDigestPresentation.curated.itemPaddingTop,
  },
  quietItem: {
    color: "#1a1a1a",
    fontFamily: emailSansFont,
    lineHeight: aiDigestPresentation.curated.itemLineHeight,
  },
  quietTitleLink: {
    color: "#1a1a1a",
    fontFamily: emailTitleFont,
    fontSize: aiDigestPresentation.curated.titleFontSize,
    fontWeight: aiDigestPresentation.curated.titleFontWeight,
    textDecoration: "none",
    [emailMobileBreakpoint]: {
      fontSize: "15px !important",
    },
  },
  quietTitleLinkRead: {
    color: "#8a8a8a",
  },
  quietByline: {
    color: "#8a8a8a",
    fontFamily: emailSansFont,
    fontSize: aiDigestPresentation.curated.bylineFontSize,
    marginLeft: aiDigestPresentation.curated.bylineMarginLeft - separatorSpaceWidth,
    textDecoration: "none",
    [emailMobileBreakpoint]: {
      fontSize: "12px !important",
    },
  },
  missingItem: {
    padding: aiDigestPresentation.missingItem.padding,
    color: "#8a8a8a",
    fontFamily: emailSansFont,
    fontSize: aiDigestPresentation.missingItem.fontSize,
    fontStyle: "italic",
  },
}), { allowNonThemeColors: true });

const tuneDigestUrl = "/contentForYou";
// Placeholder until the dedicated explainer exists.
const digestExplanationUrl = "/posts/zd4pwyeKGuhuSKX6g";

function AiNote({ note, issueId, tuneIconUrl, classes }: {
  note: AiDigestAiNote;
  issueId: string;
  tuneIconUrl: string;
  classes: JssStyles;
}) {
  return (
    <table
      role="presentation"
      width="100%"
      cellPadding={0}
      cellSpacing={0}
      className={classes.aiNote}
    >
      <tbody>
        <tr>
          <td className={classes.aiNoteCell}>
            <div className={classes.aiNoteLabel}>AI Note · {note.modelName}</div>
            {note.paragraphs.map((paragraph, index) => (
              <p
                key={index}
                className={classNames(
                  classes.aiNoteParagraph,
                  index === 0 && classes.aiNoteFirstParagraph,
                )}
              >
                {paragraph}
              </p>
            ))}
            <table
              role="presentation"
              width="100%"
              cellPadding={0}
              cellSpacing={0}
              className={classes.aiNoteFooter}
            >
              <tbody>
                <tr>
                  <td className={classes.aiNoteFooterLeftCell}>
                    <a
                      href={aiDigestChromeLinkUrl(tuneDigestUrl, "tune", issueId)}
                      className={classes.aiNoteTuneLink}
                    >
                      <img
                        src={tuneIconUrl}
                        width={tuneIconSize}
                        height={tuneIconSize}
                        alt=""
                        className={classNames(classes.tuneIcon, classes.tuneIconWithLabel)}
                      />
                      {" "}tune your AI recommendations
                    </a>
                  </td>
                  <td className={classes.aiNoteFooterRightCell}>
                    <a
                      href={aiDigestChromeLinkUrl(digestExplanationUrl, "explainer", issueId)}
                      className={classes.aiNoteExplanationLink}
                    >
                      what is this?
                    </a>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

function CustomPrompt({ personalInstructions, classes }: {
  personalInstructions: string;
  classes: JssStyles;
}) {
  return (
    <table
      role="presentation"
      width="100%"
      cellPadding={0}
      cellSpacing={0}
      className={classes.customPrompt}
    >
      <tbody>
        <tr>
          <td className={classes.customPromptCell}>
            <div className={classes.customPromptLabel}>Your custom prompt</div>
            <div className={classes.customPromptText}>{personalInstructions}</div>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

function ItemFooter({ readMoreUrl, readMoreLabel, reason, classes }: {
  readMoreUrl?: string;
  readMoreLabel?: string;
  reason?: string;
  classes: JssStyles;
}) {
  return (
    <table
      role="presentation"
      width="100%"
      cellPadding={0}
      cellSpacing={0}
      className={classes.footerRow}
    >
      <tbody>
        <tr>
          <td className={classes.footerCell}>
            <table
              role="presentation"
              width="100%"
              cellPadding={0}
              cellSpacing={0}
              className={classes.footerLayout}
            >
              <tbody>
                <tr>
                  {readMoreUrl && (
                    <td className={classes.footerReadMoreCell}>
                      <a href={readMoreUrl} className={classes.readLink}>{readMoreLabel ?? "Read more"}</a>
                    </td>
                  )}
                  {reason && (
                    <td className={classes.footerReasonCell}>
                      <span className={classes.footerReason}>{reason}</span>
                    </td>
                  )}
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

function HeadlinePost({ post, item, slot, classes }: {
  post: AiDigestEmailPost;
  item: AiDigestItem;
  slot: AiDigestLinkSlot;
  classes: JssStyles;
}) {
  const postUrl = postGetPageUrl(post);
  const imageUrl = post.socialPreviewData.imageUrl;
  const preview = item.previewHtml
    ? buildPreview(
      emailPreviewHtml(item.previewHtml),
      aiDigestPresentation.previewHtmlCharacters.headlinePost,
    )
    : null;
  const excerpt = preview
    ? preview.text
    : truncateText(
      post.contents?.plaintextDescription ?? "",
      aiDigestPresentation.excerptCharacters.headlinePost,
    );

  return (
    <table
      role="presentation"
      width="100%"
      cellPadding={0}
      cellSpacing={0}
      className={classes.headlineCard}
    >
      <tbody>
        {imageUrl && (
          <tr>
            <td>
              <a
                href={aiDigestItemLinkUrl(postUrl, "image", slot)}
                aria-label={`Open ${post.title}`}
              >
                <img
                  src={croppedEmailImageUrl(imageUrl, headlineImageWidth, aiDigestPresentation.headline.imageHeight)}
                  width={headlineImageWidth}
                  height={aiDigestPresentation.headline.imageHeight}
                  alt=""
                  className={classes.headlineImage}
                />
              </a>
            </td>
          </tr>
        )}
        <tr>
          <td className={classes.headlineBody}>
            <h2 className={classes.headlineTitle}>
              <a href={aiDigestItemLinkUrl(postUrl, "title", slot)} className={classes.titleLink}>
                {post.title}
              </a>
            </h2>
            <div className={classes.metadata}>
              <a href={aiDigestItemLinkUrl(postUrl, "byline", slot)} className={classes.metadataLink}>
                {formatPostAuthors(post)}
              </a>
            </div>
            {preview ? (
              <EmailContentItemBody
                className={classes.previewBody}
                dangerouslySetInnerHTML={{ __html: preview.html }}
              />
            ) : excerpt && (
              <a href={aiDigestItemLinkUrl(postUrl, "excerpt", slot)} className={classes.textLink}>
                <p className={classes.excerpt}>{excerpt}</p>
              </a>
            )}
            <ItemFooter
              readMoreUrl={aiDigestItemLinkUrl(postUrl, "readMore", slot)}
              readMoreLabel={postReadMoreLabel(post, excerpt)}
              reason={item.reason}
              classes={classes}
            />
          </td>
        </tr>
      </tbody>
    </table>
  );
}

function CompactPost({ post, item, slot, classes }: {
  post: AiDigestEmailPost;
  item: AiDigestItem;
  slot: AiDigestLinkSlot;
  classes: JssStyles;
}) {
  const postUrl = postGetPageUrl(post);
  const imageUrl = post.socialPreviewData.imageUrl;
  const preview = item.previewHtml
    ? buildPreview(
      emailPreviewHtml(item.previewHtml),
      aiDigestPresentation.previewHtmlCharacters.compactPost,
    )
    : null;
  const excerpt = preview
    ? preview.text
    : truncateText(
      post.contents?.plaintextDescription ?? "",
      aiDigestPresentation.excerptCharacters.compactPost,
    );

  return (
    <table
      role="presentation"
      width="100%"
      cellPadding={0}
      cellSpacing={0}
      className={classes.compactCard}
    >
      <tbody>
        <tr>
          <td className={classes.compactTextCell}>
            <h3 className={classes.compactTitle}>
              <a href={aiDigestItemLinkUrl(postUrl, "title", slot)} className={classes.titleLink}>
                {post.title}
              </a>
            </h3>
            <a href={aiDigestItemLinkUrl(postUrl, "byline", slot)} className={classes.compactByline}>
              {formatPostAuthors(post)}
            </a>
            {preview ? (
              <EmailContentItemBody
                className={classes.compactPreviewBody}
                dangerouslySetInnerHTML={{ __html: preview.html }}
              />
            ) : excerpt && (
              <a href={aiDigestItemLinkUrl(postUrl, "excerpt", slot)} className={classes.textLink}>
                <p className={classes.compactExcerpt}>{excerpt}</p>
              </a>
            )}
          </td>
          {imageUrl && (
            <td className={classes.compactImageCell}>
              <a
                href={aiDigestItemLinkUrl(postUrl, "image", slot)}
                aria-label={`Open ${post.title}`}
              >
                <img
                  src={croppedEmailImageUrl(
                    imageUrl,
                    aiDigestPresentation.compact.imageWidth,
                    aiDigestPresentation.compact.imageHeight,
                  )}
                  width={aiDigestPresentation.compact.imageWidth}
                  height={aiDigestPresentation.compact.imageHeight}
                  alt=""
                  className={classes.compactImage}
                />
              </a>
            </td>
          )}
        </tr>
        <tr>
          <td colSpan={imageUrl ? 2 : 1} className={classes.compactFooterCell}>
            <ItemFooter
              readMoreUrl={aiDigestItemLinkUrl(postUrl, "readMore", slot)}
              readMoreLabel={postReadMoreLabel(post, excerpt)}
              reason={item.reason}
              classes={classes}
            />
          </td>
        </tr>
      </tbody>
    </table>
  );
}

function QuietPost({ post, isRead, slot, classes }: {
  post: AiDigestEmailPost;
  isRead: boolean;
  slot: AiDigestLinkSlot;
  classes: JssStyles;
}) {
  const postUrl = postGetPageUrl(post);
  return (
    <div className={classes.quietItem}>
      <a
        href={aiDigestItemLinkUrl(postUrl, "title", slot)}
        className={classNames(
          classes.quietTitleLink,
          isRead && classes.quietTitleLinkRead,
        )}
      >
        {post.title}
      </a>
      <a href={aiDigestItemLinkUrl(postUrl, "byline", slot)} className={classes.quietByline}>
        {" "}{formatPostAuthors(post)}
      </a>
    </div>
  );
}

function QuickTakeItem({ comment, item, slot, classes }: {
  comment: AiDigestEmailComment;
  item: AiDigestItem;
  slot: AiDigestLinkSlot;
  classes: JssStyles;
}) {
  const commentUrl = getCommentUrl(comment);
  const text = truncateText(
    comment.contents?.plaintextMainText ?? "",
    aiDigestPresentation.excerptCharacters.fullQuickTake,
  );

  return (
    <table
      role="presentation"
      width="100%"
      cellPadding={0}
      cellSpacing={0}
      className={classes.quickTakeCard}
    >
      <tbody>
        <tr>
          <td className={classes.quickTakeBody}>
            <table
              role="presentation"
              width="100%"
              cellPadding={0}
              cellSpacing={0}
              className={classes.quickTakeMeta}
            >
              <tbody>
                <tr>
                  <td className={classes.quickTakeAuthorCell}>
                    <a
                      href={aiDigestItemLinkUrl(commentUrl, "byline", slot)}
                      className={classes.quickTakeLink}
                    >
                      <span className={classes.quickTakeAuthor}>
                        {comment.user?.displayName ?? "A LessWrong reader"}
                      </span>
                      <span className={classes.quickTakeDate}>{" "}{formatDate(comment.postedAt)}</span>
                    </a>
                  </td>
                  <td className={classes.quickTakeLabelCell}>
                    <table role="presentation" cellPadding={0} cellSpacing={0}>
                      <tbody>
                        <tr>
                          <td className={classes.quickTakeLabel}>Quick take</td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>
            {text && (
              <a
                href={aiDigestItemLinkUrl(commentUrl, "excerpt", slot)}
                className={classes.quickTakeLink}
              >
                <p className={classes.quickTakeText}>{text}</p>
              </a>
            )}
            <ItemFooter
              readMoreUrl={aiDigestItemLinkUrl(commentUrl, "readMore", slot)}
              readMoreLabel="Read more"
              reason={item.reason}
              classes={classes}
            />
          </td>
        </tr>
      </tbody>
    </table>
  );
}

function CommentBox({
  node,
  anchorCommentId,
  contextCommentIds,
  nestingLevel = 0,
  slot,
  classes,
}: {
  node: CommentTreeNode<AiDigestEmailComment>;
  anchorCommentId: string;
  contextCommentIds: string[];
  nestingLevel?: number;
  slot: AiDigestLinkSlot;
  classes: JssStyles;
}) {
  const comment = node.item;
  const maxLength = discussionCommentMaxLength(
    comment._id,
    anchorCommentId,
    contextCommentIds,
  );
  const text = truncateText(comment.contents?.plaintextMainText ?? "", maxLength);
  const commentUrl = getCommentUrl(comment);
  return (
    <table
      role="presentation"
      width="100%"
      cellPadding={0}
      cellSpacing={0}
      className={classNames(
        classes.commentBox,
        nestingLevel === 0 ? classes.commentBoxRoot : classes.commentBoxReply,
        nestingLevel > 0 && (nestingLevel % 2 === 0 ? classes.commentBoxOdd : classes.commentBoxEven),
      )}
    >
      <tbody>
        <tr>
          <td className={classes.commentContent}>
            <a
              href={aiDigestItemLinkUrl(commentUrl, "threadComment", slot)}
              className={classes.commentLink}
            >
              <div className={classes.commentByline}>
                {comment.user?.displayName ?? "A LessWrong reader"}
                <span className={classes.commentBylineDate}>{" "}{formatDate(comment.postedAt)}</span>
              </div>
              <div className={classes.commentText}>{text}</div>
            </a>
          </td>
        </tr>
        {node.children.map((reply) => (
          <tr key={reply.item._id}>
            <td className={classes.commentReplyCell}>
              <CommentBox
                node={reply}
                anchorCommentId={anchorCommentId}
                contextCommentIds={contextCommentIds}
                nestingLevel={nestingLevel + 1}
                slot={slot}
                classes={classes}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function DiscussionItem({
  anchorComment,
  item,
  content,
  slot,
  classes,
}: {
  anchorComment: AiDigestEmailComment;
  item: AiDigestItem;
  content: DigestContentLookup;
  slot: AiDigestLinkSlot;
  classes: JssStyles;
}) {
  const commentUrl = getCommentUrl(anchorComment);
  const { prefix, subject } = threadTitle(anchorComment);
  const { roots, contextCommentIds } = aiDigestDiscussionThread(item, content);

  return (
    <table
      role="presentation"
      width="100%"
      cellPadding={0}
      cellSpacing={0}
      className={classes.discussionCard}
    >
      <tbody>
        <tr>
          <td className={classes.discussionBody}>
            <h3 className={classes.discussionThreadTitle}>
              <a
                href={aiDigestItemLinkUrl(commentUrl, "title", slot)}
                className={classes.discussionThreadTitleLink}
              >
                {prefix ? `${prefix} ` : ""}
                <span className={classes.discussionThreadTitleSubject}>{subject}</span>
              </a>
            </h3>
            {roots.map((root) => (
              <CommentBox
                key={root.item._id}
                node={root}
                anchorCommentId={anchorComment._id}
                contextCommentIds={contextCommentIds}
                slot={slot}
                classes={classes}
              />
            ))}
            <ItemFooter
              readMoreUrl={aiDigestItemLinkUrl(commentUrl, "readMore", slot)}
              readMoreLabel="View thread"
              reason={item.reason}
              classes={classes}
            />
          </td>
        </tr>
      </tbody>
    </table>
  );
}

function DigestItem({ item, content, slot, classes }: {
  item: AiDigestItem;
  content: DigestContentLookup;
  slot: AiDigestLinkSlot;
  classes: JssStyles;
}) {
  if (item.documentRef.documentType === "post") {
    const post = content.postsById.get(item.documentRef.documentId);
    if (!post) {
      return <div className={classes.missingItem}>This post is no longer available.</div>;
    }
    if (item.placement === "quiet") {
      return (
        <QuietPost
          post={post}
          isRead={item.isRead ?? false}
          slot={slot}
          classes={classes}
        />
      );
    }
    if (item.placement === "compact") {
      return <CompactPost post={post} item={item} slot={slot} classes={classes} />;
    }
    return <HeadlinePost post={post} item={item} slot={slot} classes={classes} />;
  }

  const comment = content.commentsById.get(item.documentRef.documentId);
  if (!comment) {
    return <div className={classes.missingItem}>This discussion item is no longer available.</div>;
  }
  if (item.documentRef.documentType === "quickTake") {
    return (
      <QuickTakeItem
        comment={comment}
        item={item}
        slot={slot}
        classes={classes}
      />
    );
  }
  return (
    <DiscussionItem
      anchorComment={comment}
      item={item}
      content={content}
      slot={slot}
      classes={classes}
    />
  );
}

function DigestSection({ section, issueId, content, classes }: {
  section: AiDigestSection;
  issueId: string;
  content: DigestContentLookup;
  classes: JssStyles;
}) {
  const isCuratedSection = section.kind === "curated";
  return (
    <table
      role="presentation"
      width="100%"
      cellPadding={0}
      cellSpacing={0}
      className={classes.section}
    >
      <tbody>
        {section.title && (
          <tr>
            <td className={classes.sectionHeadingCell}>
              {isCuratedSection ? (
                <table
                  role="presentation"
                  width="100%"
                  cellPadding={0}
                  cellSpacing={0}
                  className={classes.curatedHeading}
                >
                  <tbody>
                    <tr>
                      <td className={classes.curatedHeadingLabelCell}>{section.title}</td>
                      <td className={classes.curatedHeadingRuleCell}>
                        <div className={classes.curatedHeadingRule}>&nbsp;</div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              ) : (
                <h2 className={classes.sectionTitle}>{section.title}</h2>
              )}
            </td>
          </tr>
        )}
        {section.items.map((item, index) => (
          <tr key={itemKey(item)}>
            <td
              className={
                item.placement === "quiet"
                  ? (index === 0 ? classes.quietItemFirstCell : classes.quietItemCell)
                  : classes.itemCell
              }
            >
              <DigestItem
                item={item}
                content={content}
                slot={{ issueId, sectionKind: section.kind, itemIndex: index }}
                classes={classes}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export async function AiDigestEmail({ spec, issueId, emailContext }: {
  spec: AiDigestSpec;
  issueId: string;
  emailContext: EmailContextType;
}) {
  const classes = emailUseStyles(styles, emailContext);
  const siteUrl = getSiteUrl(emailContext.resolverContext.forumType);
  const { postIds, commentIds } = aiDigestContentIds(spec);

  const [postsResult, commentsResult] = await Promise.all([
    emailUseQuery(AiDigestEmailPostsQuery, {
      variables: { postIds },
      emailContext,
      skip: postIds.length === 0,
    }),
    emailUseQuery(AiDigestEmailCommentsQuery, {
      variables: { commentIds },
      emailContext,
      skip: commentIds.length === 0,
    }),
  ]);

  const posts = postsResult.data?.posts?.results ?? [];
  const comments = commentsResult.data?.comments?.results ?? [];
  const content: DigestContentLookup = {
    postsById: new Map(posts.map((post) => [post._id, post])),
    commentsById: new Map(comments.map((comment) => [comment._id, comment])),
  };

  return (
    <>
      <div className={classes.preheader}>{spec.preheader}</div>
      <table
        role="presentation"
        width="100%"
        cellPadding={0}
        cellSpacing={0}
        className={classes.shell}
      >
        <tbody>
          <tr>
            <td className={classes.shellCell}>
              <table
                role="presentation"
                width="100%"
                cellPadding={0}
                cellSpacing={0}
                className={classes.masthead}
              >
                <tbody>
                  <tr>
                    <td className={classes.mastheadCompassCell}>
                      <a
                        href={aiDigestChromeLinkUrl(mastheadHomeUrl, "masthead", issueId)}
                        className={classes.mastheadCompassLink}
                        aria-label="LessWrong"
                      >
                        <img
                          src={aiDigestEmailAssetUrl(siteUrl, "compassRose.png")}
                          width={compassRoseIconSize}
                          height={compassRoseIconSize}
                          alt=""
                          className={classes.mastheadCompassIcon}
                        />
                      </a>
                    </td>
                    <td className={classes.mastheadNameCell}>
                      <a
                        href={aiDigestChromeLinkUrl(mastheadHomeUrl, "masthead", issueId)}
                        className={classes.wordmark}
                      >
                        LessWrong
                      </a>
                      <div className={classes.mastheadProductName}>Content for You</div>
                    </td>
                    <td className={classes.mastheadUnsubscribeCell}>
                      <a
                        href={mastheadUnsubscribeUrl}
                        className={classes.mastheadUnsubscribeLink}
                      >
                        unsubscribe
                      </a>
                    </td>
                  </tr>
                </tbody>
              </table>

              <AiNote
                note={spec.aiNote}
                issueId={issueId}
                tuneIconUrl={aiDigestEmailAssetUrl(siteUrl, "tuneIcon.png")}
                classes={classes}
              />

              {spec.personalInstructions && (
                <CustomPrompt
                  personalInstructions={spec.personalInstructions}
                  classes={classes}
                />
              )}

              {spec.sections.map((section) => (
                <DigestSection
                  key={section.kind}
                  section={section}
                  issueId={issueId}
                  content={content}
                  classes={classes}
                />
              ))}
            </td>
          </tr>
        </tbody>
      </table>
    </>
  );
}

export function aiDigestEmailBody(spec: AiDigestSpec, issueId: string) {
  return function renderAiDigestEmail(emailContext: EmailContextType) {
    return <AiDigestEmail spec={spec} issueId={issueId} emailContext={emailContext} />;
  };
}
