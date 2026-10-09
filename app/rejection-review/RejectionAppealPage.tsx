"use client";

import React, { useState } from "react";
import classNames from "classnames";
import { useMutation } from "@apollo/client/react";
import { gql } from "@/lib/generated/gql-codegen";
import { useQuery } from "@/lib/crud/useQuery";
import { useCurrentUser } from "@/components/common/withUser";
import { defineStyles, useStyles } from "@/components/hooks/useStyles";
import SingleColumnSection from "@/components/common/SingleColumnSection";
import SectionTitle from "@/components/common/SectionTitle";
import Loading from "@/components/vulcan-core/Loading";
import ContentStyles from "@/components/common/ContentStyles";
import { ContentItemBody } from "@/components/contents/ContentItemBody";
import Checkbox from "@/lib/vendor/@material-ui/core/src/Checkbox";
import { Link } from "@/lib/reactRouterWrapper";
import { useLocation } from "@/lib/routeUtil";
import { postGetPageUrl } from "@/lib/collections/posts/helpers";
import { commentGetPageUrlFromIds } from "@/lib/collections/comments/helpers";
import { conversationGetPageUrl } from "@/lib/collections/conversations/helpers";
import uniq from "lodash/uniq";
import { APPEAL_REASONS, type AppealReason } from "@/lib/collections/rejectionAppeals/appealReasons";

const RejectionReviewQuery = gql(`
  query RejectionAppealPageQuery($postId: String, $commentId: String) {
    rejectionReview(postId: $postId, commentId: $commentId) {
      post {
        _id
        slug
        title
        rejectedReason
      }
      comment {
        _id
        rejectedReason
        post {
          _id
          slug
          title
        }
      }
      appeal {
        ...RejectionAppealsUserInfo
      }
      reasonIds
      unavailableReason
    }
  }
`);

const CreateRejectionAppealMutation = gql(`
  mutation createRejectionAppealRejectionAppealPage($data: CreateRejectionAppealDataInput!) {
    createRejectionAppeal(data: $data) {
      data {
        ...RejectionAppealsUserInfo
      }
    }
  }
`);

const styles = defineStyles("RejectionAppealPage", (theme: ThemeType) => ({
  card: {
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
    maxWidth: 680,
    background: theme.palette.panelBackground.default,
    border: theme.palette.border.faint,
    borderRadius: 6,
    padding: "24px 32px 28px",
    [theme.breakpoints.down("xs")]: {
      padding: "20px 16px 24px",
    },
  },
  section: {
    marginTop: 28,
    paddingTop: 24,
    borderTop: theme.palette.border.faint,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    color: theme.palette.text.dim,
    marginBottom: 10,
  },
  misunderstandings: {
    marginTop: 0,
    marginBottom: 16,
    paddingLeft: 20,
    lineHeight: 1.6,
    "& li": {
      marginBottom: 6,
    },
  },
  clarificationNote: {
    marginTop: 16,
    marginBottom: 0,
    lineHeight: 1.6,
  },
  submitRow: {
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 16,
    marginTop: 28,
  },
  contentTitleBlock: {
    marginBottom: 14,
  },
  contentKind: {
    fontSize: 13,
    color: theme.palette.text.dim,
    marginBottom: 2,
  },
  contentTitle: {
    fontFamily: theme.palette.fonts.serifStack,
    fontSize: 22,
    lineHeight: 1.3,
    color: theme.palette.text.normal,
    "&:hover": {
      color: theme.palette.primary.main,
    },
  },
  contentHeader: {
    padding: "14px 16px",
    borderRadius: 4,
    background: theme.palette.greyAlpha(0.04),
    border: theme.palette.border.faint,
  },
  rejectionHeading: {
    fontSize: 13,
    color: theme.palette.text.dim,
    marginBottom: 4,
  },
  fullReason: {
    "& ul, & ol": { paddingLeft: 20 },
    "& p:last-child": { marginBottom: 0 },
  },
  paragraph: {
    marginTop: 0,
    marginBottom: 16,
    lineHeight: 1.6,
  },
  inlineLink: {
    color: theme.palette.primary.main,
  },
  prompt: {
    fontWeight: 600,
    marginTop: 0,
    marginBottom: 12,
  },
  options: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  option: {
    borderRadius: 4,
    border: theme.palette.border.faint,
    transition: "background-color 0.1s ease, border-color 0.1s ease",
    "&:hover": {
      background: theme.palette.greyAlpha(0.03),
    },
  },
  optionLabel: {
    display: "flex",
    alignItems: "flex-start",
    gap: 6,
    padding: "10px 12px 10px 6px",
    cursor: "pointer",
    lineHeight: 1.5,
  },
  optionChecked: {
    background: theme.palette.background.primaryTranslucent,
    borderColor: theme.palette.primary.main,
    "&:hover": {
      background: theme.palette.background.primaryTranslucent,
    },
  },
  checkbox: {
    padding: 0,
    marginTop: 1,
    marginLeft: 4,
    marginRight: 4,
  },
  textarea: {
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
    display: "block",
    width: "100%",
    boxSizing: "border-box",
    minHeight: 200,
    padding: "10px 12px",
    borderRadius: 4,
    border: theme.palette.border.normal,
    background: theme.palette.panelBackground.default,
    color: theme.palette.text.normal,
    lineHeight: 1.5,
    resize: "vertical",
    outline: "none",
    "&:focus": {
      borderColor: theme.palette.primary.main,
      boxShadow: `0 0 0 2px ${theme.palette.background.primaryTranslucent}`,
    },
  },
  button: {
    ...theme.typography.commentStyle,
    display: "inline-block",
    fontSize: 14,
    fontWeight: 500,
    padding: "9px 20px",
    borderRadius: 4,
    cursor: "pointer",
    border: "none",
    transition: "opacity 0.1s ease, background-color 0.1s ease",
  },
  primaryButton: {
    background: theme.palette.primary.main,
    color: theme.palette.buttons.primaryDarkText,
    marginLeft: "auto",
    "&:hover": {
      opacity: 0.9,
      color: theme.palette.buttons.primaryDarkText,
    },
    "&:disabled": {
      background: theme.palette.greyAlpha(0.1),
      color: theme.palette.text.dim,
      cursor: "default",
      opacity: 1,
    },
  },
  error: {
    color: theme.palette.error.main,
    marginTop: 12,
  },
  endState: {
    textAlign: "center",
    padding: "16px 0 4px",
  },
  endStateMessage: {
    marginTop: 0,
    marginBottom: 20,
    lineHeight: 1.6,
  },
  endStateHeading: {
    fontSize: 18,
    fontWeight: 600,
    marginTop: 0,
    marginBottom: 10,
  },
  callout: {
    padding: "12px 16px",
    marginBottom: 16,
    borderRadius: 4,
    borderLeft: `3px solid ${theme.palette.primary.main}`,
    background: theme.palette.background.primaryTranslucent,
    lineHeight: 1.6,
  },
  mutedParagraph: {
    marginTop: 0,
    marginBottom: 16,
    lineHeight: 1.6,
    color: theme.palette.text.dim,
  },
  submittedSummary: {
    textAlign: "left",
    marginTop: 28,
    padding: "14px 16px",
    borderRadius: 4,
    border: theme.palette.border.faint,
    background: theme.palette.greyAlpha(0.04),
  },
  summaryHeading: {
    fontWeight: 600,
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 13,
    color: theme.palette.text.dim,
    marginTop: 10,
    marginBottom: 2,
  },
  summaryExplanation: {
    whiteSpace: "pre-wrap",
    lineHeight: 1.5,
  },
}));

type ContentType = "post" | "comment";
type AppealStatus = "open" | "approved" | "denied";

const APPEAL_STATUS_LABELS: Record<AppealStatus, string> = {
  open: "Under review",
  approved: "Rejection reversed",
  denied: "Rejection upheld",
};

interface AppealedItem {
  contentType: ContentType;
  contentTitle: string;
  contentUrl: string;
  rejectedReason: string | null;
}

const AppealedContentHeader = ({ item }: { item: AppealedItem }) => {
  const classes = useStyles(styles);
  return <>
    <div className={classes.contentTitleBlock}>
      <div className={classes.contentKind}>Your content:</div>
      {item.contentTitle && <Link className={classes.contentTitle} to={item.contentUrl}>{item.contentTitle}</Link>}
    </div>
    {item.rejectedReason && <div className={classes.contentHeader}>
      <div className={classes.rejectionHeading}>Our message to you:</div>
      <ContentStyles contentType="comment" className={classes.fullReason}>
        <ContentItemBody dangerouslySetInnerHTML={{ __html: item.rejectedReason }} />
      </ContentStyles>
    </div>}
  </>;
};

const IntroSection = ({ contentType, hasMisunderstandings }: { contentType: ContentType, hasMisunderstandings: boolean }) => {
  const classes = useStyles(styles);
  return <div>
    <p className={classes.paragraph}>
      Thank you for attempting to contribute to LessWrong. We're sorry your {contentType} was rejected. We know
      that's frustrating, especially when you've put real work into something.
    </p>
    <p className={classes.paragraph}>
      As moderators of LessWrong, we face difficult tradeoffs in encouraging new submissions, maintaining quality
      standards, and preserving LessWrong's unique and special norms for research and discussion. We very much want
      to approve good new content!
    </p>
    <p className={classes.paragraph}>
      A rejection of your content is not necessarily a harsh criticism of your work. LessWrong is a very particular
      place with specific communication norms. Also a number of our rules for first submissions are about reducing
      the time required for moderators to vet content so we can process new submissions quickly. Overall, users who
      have been regular readers on the site for a while are much more likely to have their content approved compared
      to those only discovering LessWrong recently and seeking to post immediately. It takes time to understand
      LessWrong and often the best response to a rejection is to spend more time reading on the site.
    </p>
    <p className={classes.paragraph}>
      Our rejections are often nuanced. Please confirm your understanding of the rejection reason before requesting a
      review. Before requesting a review, please read the{" "}
      <Link className={classes.inlineLink} to="/posts/LbbrnRvc9QwjJeics/new-user-s-guide-to-lesswrong">
        New User's Guide
      </Link> and{" "}
      <Link
        className={classes.inlineLink}
        to="/posts/nQWavk9mnwcv6ScMR/new-lesswrong-editor-also-an-update-to-our-llm-policy#Policy_on_LLM_Use"
      >
        our policy on LLM-generated content
      </Link>.{hasMisunderstandings && " Common misunderstandings of your rejection reasons are listed below."}
    </p>
    <p className={classes.paragraph}>
      If you still wish to request a review, please proceed!
    </p>
    <div className={classes.callout}>
      If you do request a review, a moderator will look at it, usually within 72 hours, and reply in your
      conversation with us.
    </div>
    <p className={classes.mutedParagraph}>
      A rejection isn't a ban, and we usually allow for several attempts to submit content before disallowing
      additional tries. If you'd rather not request a review, you're welcome to take the feedback on board and submit something
      new later.
    </p>
  </div>;
};

const MisunderstandingsSection = ({ misunderstandings, acknowledged, onToggle }: {
  misunderstandings: string[],
  acknowledged: boolean,
  onToggle: () => void,
}) => {
  const classes = useStyles(styles);
  return <div className={classes.section}>
    <div className={classes.sectionHeading}>Policy</div>
    <p className={classes.paragraph}>
      The following are common misunderstandings that cause users to request reviews of valid rejections. Please
      read these over carefully and confirm that these are <em>not</em> the basis of your request.
    </p>
    <ul className={classes.misunderstandings}>
      {misunderstandings.map(misunderstanding => <li key={misunderstanding}>{misunderstanding}</li>)}
    </ul>
    <div className={classNames(classes.option, { [classes.optionChecked]: acknowledged })}>
      <label className={classes.optionLabel}>
        <Checkbox className={classes.checkbox} checked={acknowledged} onChange={onToggle} disableRipple />
        <span>I've read these, and they aren't the basis of my request.</span>
      </label>
    </div>
    <ClarificationNote />
  </div>;
};

const ClarificationNote = () => {
  const classes = useStyles(styles);
  return <p className={classes.clarificationNote}>
    We also further apologize that we generally cannot reply to requests for further clarification about why a
    rejection was made due to the volume of submissions and review requests. We attempt to make the rejection reasons
    comprehensive. Feel free to leave a specific question or two and we might get back to you. As above, reading more
    of LessWrong content is the best way to understand site requirements.
  </p>;
};

const ViewConversationButton = ({ conversationId }: { conversationId: string }) => {
  const classes = useStyles(styles);
  return <Link
    className={classNames(classes.button, classes.primaryButton)}
    to={conversationGetPageUrl({ _id: conversationId })}
  >
    View conversation
  </Link>;
};

const SubmittedState = ({ item, reasons, explanation, conversationId }: {
  item: AppealedItem,
  reasons: AppealReason[],
  explanation: string,
  conversationId: string | null,
}) => {
  const classes = useStyles(styles);
  return <div className={classes.endState}>
    <h2 className={classes.endStateHeading}>Your review request has been submitted</h2>
    <p className={classes.endStateMessage}>
      Thanks for taking the time to explain. A moderator will look at your request, usually within 72 hours. We've
      added a summary of it to your conversation with us, and we'll message you there once we've made a decision.
      You can add anything else there in the meantime.
    </p>
    {conversationId && <ViewConversationButton conversationId={conversationId} />}
    <div className={classes.submittedSummary}>
      <div className={classes.summaryHeading}>What you sent</div>
      <div>{item.contentType === "post" ? `Post: ${item.contentTitle}` : item.contentTitle}</div>
      {reasons.length > 0 && <>
        <div className={classes.summaryLabel}>Reason</div>
        <div>{reasons.map(reason => reason.label).join(", ")}</div>
      </>}
      <div className={classes.summaryLabel}>Your explanation</div>
      <div className={classes.summaryExplanation}>{explanation}</div>
    </div>
  </div>;
};

const AlreadyAppealedState = ({ appeal }: { appeal: RejectionAppealsUserInfo }) => {
  const classes = useStyles(styles);
  return <div className={classes.endState}>
    <h2 className={classes.endStateHeading}>You've already requested a review of this rejection</h2>
    <p className={classes.endStateMessage}>
      {appeal.status && <>Status: {APPEAL_STATUS_LABELS[appeal.status]}</>}
      {appeal.status === "open" && <>
        <br />
        We aim to complete reviews within 72 hours. We'll message you in your conversation with us once we've made
        a decision.
      </>}
    </p>
    {appeal.conversationId && <ViewConversationButton conversationId={appeal.conversationId} />}
  </div>;
};

const NotAppealableState = ({ reason }: { reason?: string | null }) => {
  const classes = useStyles(styles);
  return <div className={classes.endState}>
    <p className={classes.endStateMessage}>
      {reason ?? "We couldn't find a rejected post or comment to review from this link. Please reply in your conversation with us."}
    </p>
  </div>;
};

const RejectionAppealPage = () => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  const { query } = useLocation();
  const [acknowledgedMisunderstandings, setAcknowledgedMisunderstandings] = useState(false);
  const [explanation, setExplanation] = useState("");
  const [error, setError] = useState<string | null>(null);

  const postId = query.postId || null;
  const commentId = query.commentId || null;

  const { data, loading, error: queryError } = useQuery(RejectionReviewQuery, {
    variables: { postId, commentId },
    errorPolicy: "all",
    skip: !currentUser || (!postId && !commentId),
  });
  const [createAppeal, { loading: submitting, data: submission }] = useMutation(CreateRejectionAppealMutation);

  if (!currentUser) {
    return <SingleColumnSection>Please log in to request a rejection review.</SingleColumnSection>;
  }
  if (loading && !data) {
    return <Loading />;
  }

  const review = data?.rejectionReview;
  const document = review?.post ?? review?.comment;
  const post = review?.post ?? review?.comment?.post;
  const item: AppealedItem | null = document ? {
    contentType: postId ? "post" : "comment",
    contentTitle: postId ? (post?.title ?? "") : (post ? `Comment on ${post.title}` : "Comment"),
    contentUrl: postId
      ? (post ? postGetPageUrl(post) : "")
      : commentGetPageUrlFromIds({ postId: post?._id, postSlug: post?.slug, commentId }),
    rejectedReason: document.rejectedReason,
  } : null;
  const reasons = APPEAL_REASONS.filter(reason => review?.reasonIds.includes(reason.id));
  const submittedAppeal = submission?.createRejectionAppeal?.data;
  const misunderstandings = uniq(reasons.flatMap(reason => reason.commonMisunderstandings));
  const canSubmit = !!explanation.trim() && !submitting;

  const submit = async () => {
    if (!item) return;
    setError(null);
    try {
      await createAppeal({
        variables: { data: {
          postId,
          commentId,
          acknowledgedMisunderstandings: misunderstandings.length > 0 && acknowledgedMisunderstandings,
          explanation,
        } },
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong submitting your request. Please try again.");
    }
  };

  const renderCardContents = () => {
    if (submittedAppeal && item) {
      return <SubmittedState
        item={item}
        reasons={reasons}
        explanation={explanation}
        conversationId={submittedAppeal.conversationId}
      />;
    }
    if (!item) {
      return <NotAppealableState reason={queryError?.message} />;
    }
    if (review?.appeal) {
      return <AlreadyAppealedState appeal={review.appeal} />;
    }
    if (review?.unavailableReason) {
      return <NotAppealableState reason={review.unavailableReason} />;
    }
    return <>
      <IntroSection contentType={item.contentType} hasMisunderstandings={misunderstandings.length > 0} />
      <div className={classes.section}>
        <AppealedContentHeader item={item} />
      </div>
      {misunderstandings.length > 0
        ? <MisunderstandingsSection
          misunderstandings={misunderstandings}
          acknowledged={acknowledgedMisunderstandings}
          onToggle={() => setAcknowledgedMisunderstandings(!acknowledgedMisunderstandings)}
        />
        : <div className={classes.section}><ClarificationNote /></div>}
      <div className={classes.section}>
        <div className={classes.sectionHeading}>Your explanation</div>
        <p className={classes.prompt}>In your own words, tell us why you think the rejection was a mistake.</p>
        <textarea className={classes.textarea} value={explanation} onChange={e => setExplanation(e.target.value)} />
      </div>
      {error && <div className={classes.error}>{error}</div>}
      <div className={classes.submitRow}>
        <button
          className={classNames(classes.button, classes.primaryButton)}
          onClick={() => void submit()}
          disabled={!canSubmit}
        >
          {submitting ? "Submitting..." : "Request review"}
        </button>
      </div>
    </>;
  };

  return <SingleColumnSection>
    <SectionTitle title="Request a review" />
    <div className={classes.card}>
      {renderCardContents()}
    </div>
  </SingleColumnSection>;
};

export default RejectionAppealPage;
