import React from "react";
import classNames from "classnames";
import { defineStyles } from "@/components/hooks/defineStyles";
import { gql } from "@/lib/generated/gql-codegen";
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
  type AiDigestThreadNode,
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
import type { JssStyles } from "@/lib/jssStyles";
import { emailUseQuery } from "@/server/vulcan-lib/query";
import { untrackedLinkProps } from "@/lib/emails/emailTracking";
import { absoluteEmailUrl, aiDigestLinkUrl, type AiDigestLinkSlot } from "./aiDigestEmailLinks";
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

function CompassRoseIcon({ className }: {
  className?: string;
}) {
  return (
    <svg className={className} width="26" height="26" viewBox="0 0 100 100" aria-hidden="true">
      <path
        fill="currentColor"
        d="M29.1,29.2l6.4,11.6l4.3-0.8l0.8-4.3L29.1,29.2z M40.7,64.5l-0.8-4.3l-4.3-0.8L29.2,71L40.7,64.5z M70.9,70.9l-6.4-11.6l-4.3,0.8l-0.8,4.3L70.9,70.9z M64.4,40.8l6.4-11.6l-11.6,6.4l0.8,4.3L64.4,40.8z M67.4,58.8l10.8,19.4L58.8,67.4L50,98.8l-8.8-31.4L21.9,78.2l10.8-19.4L1.2,50.1l31.4-8.8L21.9,21.9l19.4,10.8L50,1.3l8.8,31.4l19.4-10.8L67.4,41.3L98.8,50L67.4,58.8zM57.7,57.8L83.5,50L50,50.1l7.7-7.7L50,16.6v33.5l-7.7-7.7l-25.8,7.7H50l-7.7,7.7L50,83.5V50.1L57.7,57.8z"
      />
    </svg>
  );
}

function TuneIcon({ className }: {
  className?: string;
}) {
  return (
    <svg className={className} width="15" height="15" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z"
      />
    </svg>
  );
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

/**
 * Styles for author-written html standing in for a plaintext excerpt. The
 * preview keeps the excerpt's typography, and, following ContentExcerpt, drops
 * multimedia and mutes links so it reads as running text rather than as a
 * second card inside the card.
 */
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
      color: "inherit",
      textDecoration: "none",
    },
    "& img, & iframe, & video": {
      display: "none",
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
    padding: "14px 8px 0 0",
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
    width: 26,
    height: 26,
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
    backgroundColor: "#e5eadc",
    borderRadius: aiDigestPresentation.aiNote.borderRadius,
  },
  aiNoteCell: {
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
    width: 15,
    height: 15,
    verticalAlign: "-3px",
  },
  customPrompt: {
    width: "100%",
    marginTop: 14,
    backgroundColor: "#e9e4d9",
    borderRadius: 6,
  },
  customPromptCell: {
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
    marginRight: 6,
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
    flexShrink: 0,
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
    display: "inline-block",
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
    paddingLeft: 12,
    textAlign: "right",
    verticalAlign: "middle",
    whiteSpace: "nowrap",
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
    marginLeft: aiDigestPresentation.quickTake.dateMarginLeft,
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
  commentBox: {
    margin: aiDigestPresentation.discussion.commentMargin,
    border: "1px solid rgba(72,94,144,0.16)",
    borderRadius: aiDigestPresentation.discussion.commentBorderRadius,
  },
  commentContent: {
    padding: aiDigestPresentation.discussion.commentPadding,
  },
  commentBoxRoot: {
    backgroundColor: "#ffffff",
  },
  commentBoxReply: {
    margin: aiDigestPresentation.discussion.replyMargin,
    borderRight: "none",
    borderRadius: aiDigestPresentation.discussion.replyBorderRadius,
    [emailMobileBreakpoint]: {
      marginLeft: "5px !important",
      marginBottom: "5px !important",
    },
  },
  // Alternating thread backgrounds, matching the onsite comments-node-odd /
  // comments-node-even colors (grey 25 and grey 120 in light mode).
  commentBoxOdd: {
    backgroundColor: "#fcfcfc",
  },
  commentBoxEven: {
    backgroundColor: "#f2f2f2",
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
    marginLeft: aiDigestPresentation.discussion.dateMarginLeft,
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
    alignItems: "baseline",
    columnGap: aiDigestPresentation.footer.columnGap,
    display: "flex",
    flexWrap: "wrap",
    rowGap: aiDigestPresentation.footer.rowGap,
  },
  // Right of the read-more link on wide layouts; on narrow screens it takes
  // its own flex line (full basis), left-aligned, with the footer rowGap above.
  footerReason: {
    color: "#9a958a",
    flex: `1 1 ${aiDigestPresentation.footer.reasonFlexBasis}px`,
    fontFamily: emailSansFont,
    fontSize: aiDigestPresentation.footer.reasonFontSize,
    fontStyle: "italic",
    lineHeight: aiDigestPresentation.footer.reasonLineHeight,
    minWidth: 0,
    textAlign: "right",
    textWrap: "balance",
    [emailMobileBreakpoint]: {
      flexBasis: "100% !important",
      textAlign: "left !important",
    },
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
  // Greyed-out title for curated posts the recipient has already read,
  // matching the read-state dimming of post items onsite.
  quietTitleLinkRead: {
    color: "#8a8a8a",
  },
  quietByline: {
    color: "#8a8a8a",
    fontFamily: emailSansFont,
    fontSize: aiDigestPresentation.curated.bylineFontSize,
    marginLeft: aiDigestPresentation.curated.bylineMarginLeft,
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

function AiNote({ note, classes }: {
  note: AiDigestAiNote;
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
                      href={aiDigestLinkUrl(tuneDigestUrl, "tune")}
                      className={classes.aiNoteTuneLink}
                    >
                      <TuneIcon className={classNames(classes.tuneIcon, classes.tuneIconWithLabel)} />
                      tune your AI recommendations
                    </a>
                  </td>
                  <td className={classes.aiNoteFooterRightCell}>
                    <a
                      href={aiDigestLinkUrl(digestExplanationUrl, "explainer")}
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

/** The reader's own custom instructions, echoed back beneath the AI note like the on-site card. */
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
            <div className={classes.footerLayout}>
              {readMoreUrl && (
                <a href={readMoreUrl} className={classes.readLink}>{readMoreLabel ?? "Read more"}</a>
              )}
              {reason && <div className={classes.footerReason}>{reason}</div>}
            </div>
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
      item.previewHtml,
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
                href={aiDigestLinkUrl(postUrl, "image", slot)}
                aria-label={`Open ${post.title}`}
              >
                <img
                  src={imageUrl}
                  width="544"
                  height="220"
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
              <a href={aiDigestLinkUrl(postUrl, "title", slot)} className={classes.titleLink}>
                {post.title}
              </a>
            </h2>
            <div className={classes.metadata}>
              <a href={aiDigestLinkUrl(postUrl, "byline", slot)} className={classes.metadataLink}>
                {formatPostAuthors(post)}
              </a>
            </div>
            {preview ? (
              <EmailContentItemBody
                className={classes.previewBody}
                dangerouslySetInnerHTML={{ __html: preview.html }}
              />
            ) : excerpt && (
              <a href={aiDigestLinkUrl(postUrl, "excerpt", slot)} className={classes.textLink}>
                <p className={classes.excerpt}>{excerpt}</p>
              </a>
            )}
            <ItemFooter
              readMoreUrl={aiDigestLinkUrl(postUrl, "readMore", slot)}
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
      item.previewHtml,
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
              <a href={aiDigestLinkUrl(postUrl, "title", slot)} className={classes.titleLink}>
                {post.title}
              </a>
            </h3>
            <a href={aiDigestLinkUrl(postUrl, "byline", slot)} className={classes.compactByline}>
              {formatPostAuthors(post)}
            </a>
            {preview ? (
              <EmailContentItemBody
                className={classes.compactPreviewBody}
                dangerouslySetInnerHTML={{ __html: preview.html }}
              />
            ) : excerpt && (
              <a href={aiDigestLinkUrl(postUrl, "excerpt", slot)} className={classes.textLink}>
                <p className={classes.compactExcerpt}>{excerpt}</p>
              </a>
            )}
          </td>
          {imageUrl && (
            <td className={classes.compactImageCell}>
              <a
                href={aiDigestLinkUrl(postUrl, "image", slot)}
                aria-label={`Open ${post.title}`}
              >
                <img src={imageUrl} width="112" height="76" alt="" className={classes.compactImage} />
              </a>
            </td>
          )}
        </tr>
        <tr>
          <td colSpan={imageUrl ? 2 : 1} className={classes.compactFooterCell}>
            <ItemFooter
              readMoreUrl={aiDigestLinkUrl(postUrl, "readMore", slot)}
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

/** Low-emphasis text row for the curated module: title and author, no card, no reason. */
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
        href={aiDigestLinkUrl(postUrl, "title", slot)}
        className={classNames(
          classes.quietTitleLink,
          isRead && classes.quietTitleLinkRead,
        )}
      >
        {post.title}
      </a>
      <a href={aiDigestLinkUrl(postUrl, "byline", slot)} className={classes.quietByline}>
        {formatPostAuthors(post)}
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
                      href={aiDigestLinkUrl(commentUrl, "byline", slot)}
                      className={classes.quickTakeLink}
                    >
                      <span className={classes.quickTakeAuthor}>
                        {comment.user?.displayName ?? "A LessWrong reader"}
                      </span>
                      <span className={classes.quickTakeDate}>{formatDate(comment.postedAt)}</span>
                    </a>
                  </td>
                  <td className={classes.quickTakeLabelCell}>
                    <span className={classes.quickTakeLabel}>Quick take</span>
                  </td>
                </tr>
              </tbody>
            </table>
            {text && (
              <a
                href={aiDigestLinkUrl(commentUrl, "excerpt", slot)}
                className={classes.quickTakeLink}
              >
                <p className={classes.quickTakeText}>{text}</p>
              </a>
            )}
            <ItemFooter
              readMoreUrl={aiDigestLinkUrl(commentUrl, "readMore", slot)}
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

/** Thread heading: the comment boxes carry author bylines, so drop the author here. */
function CommentBox({
  comment,
  replies,
  anchorCommentId,
  contextCommentIds,
  nestingLevel = 0,
  slot,
  classes,
}: {
  comment: AiDigestEmailComment;
  replies: AiDigestThreadNode<AiDigestEmailComment>[];
  anchorCommentId: string;
  contextCommentIds: string[];
  nestingLevel?: number;
  slot: AiDigestLinkSlot;
  classes: JssStyles;
}) {
  const maxLength = discussionCommentMaxLength(
    comment._id,
    anchorCommentId,
    contextCommentIds,
  );
  const text = truncateText(comment.contents?.plaintextMainText ?? "", maxLength);
  const commentUrl = getCommentUrl(comment);
  return (
    <div
      className={classNames(
        classes.commentBox,
        nestingLevel === 0 ? classes.commentBoxRoot : classes.commentBoxReply,
        nestingLevel > 0 && (nestingLevel % 2 === 0 ? classes.commentBoxOdd : classes.commentBoxEven),
      )}
    >
      <a
        href={aiDigestLinkUrl(commentUrl, "threadComment", slot)}
        className={classNames(classes.commentLink, classes.commentContent)}
      >
        <div className={classes.commentByline}>
          {comment.user?.displayName ?? "A LessWrong reader"}
          <span className={classes.commentBylineDate}>{formatDate(comment.postedAt)}</span>
        </div>
        <div className={classes.commentText}>{text}</div>
      </a>
      {replies.map((reply) => (
        <CommentBox
          key={reply.comment._id}
          comment={reply.comment}
          replies={reply.replies}
          anchorCommentId={anchorCommentId}
          contextCommentIds={contextCommentIds}
          nestingLevel={nestingLevel + 1}
          slot={slot}
          classes={classes}
        />
      ))}
    </div>
  );
}

function DiscussionItem({
  anchorComment,
  rootComment,
  item,
  threadReplies,
  contextCommentIds,
  slot,
  classes,
}: {
  anchorComment: AiDigestEmailComment;
  rootComment: AiDigestEmailComment;
  item: AiDigestItem;
  threadReplies: AiDigestThreadNode<AiDigestEmailComment>[];
  contextCommentIds: string[];
  slot: AiDigestLinkSlot;
  classes: JssStyles;
}) {
  const commentUrl = getCommentUrl(anchorComment);
  const { prefix, subject } = threadTitle(anchorComment);

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
                href={aiDigestLinkUrl(commentUrl, "title", slot)}
                className={classes.discussionThreadTitleLink}
              >
                {prefix ? `${prefix} ` : ""}
                <span className={classes.discussionThreadTitleSubject}>{subject}</span>
              </a>
            </h3>
            <CommentBox
              comment={rootComment}

              replies={threadReplies}
              anchorCommentId={anchorComment._id}
              contextCommentIds={contextCommentIds}
              slot={slot}
              classes={classes}
            />
            <ItemFooter
              readMoreUrl={aiDigestLinkUrl(commentUrl, "readMore", slot)}
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
  const { rootComment, threadReplies, contextCommentIds } = aiDigestDiscussionThread(item, comment, content);
  return (
    <DiscussionItem
      anchorComment={comment}
      rootComment={rootComment}
      item={item}
      threadReplies={threadReplies}
      contextCommentIds={contextCommentIds}
      slot={slot}
      classes={classes}
    />
  );
}

function DigestSection({ section, content, classes }: {
  section: AiDigestSection;
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
                slot={{ sectionKind: section.kind, itemIndex: index }}
                classes={classes}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export async function AiDigestEmail({ spec, emailContext }: {
  spec: AiDigestSpec;
  emailContext: EmailContextType;
}) {
  const classes = emailUseStyles(styles, emailContext);
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
                        href={aiDigestLinkUrl(mastheadHomeUrl, "masthead")}
                        className={classes.mastheadCompassLink}
                        aria-label="LessWrong"
                      >
                        <CompassRoseIcon className={classes.mastheadCompassIcon} />
                      </a>
                    </td>
                    <td className={classes.mastheadNameCell}>
                      <a
                        href={aiDigestLinkUrl(mastheadHomeUrl, "masthead")}
                        className={classes.wordmark}
                      >
                        LessWrong
                      </a>
                      <div className={classes.mastheadProductName}>Content for You</div>
                    </td>
                    <td className={classes.mastheadUnsubscribeCell}>
                      <a
                        href={absoluteEmailUrl(mastheadUnsubscribeUrl)}
                        className={classes.mastheadUnsubscribeLink}
                        {...untrackedLinkProps}
                      >
                        unsubscribe
                      </a>
                    </td>
                  </tr>
                </tbody>
              </table>

              <AiNote note={spec.aiNote} classes={classes} />

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
