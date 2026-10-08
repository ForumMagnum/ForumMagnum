"use client";

import React, { useState } from "react";
import { useMutation } from "@apollo/client/react";
import type { ResultOf } from "@graphql-typed-document-node/core";
import { gql } from "@/lib/generated/gql-codegen";
import { useQuery } from "@/lib/crud/useQuery";
import { useCurrentUser } from "@/components/common/withUser";
import { defineStyles, useStyles } from "@/components/hooks/useStyles";
import SingleColumnSection from "@/components/common/SingleColumnSection";
import SectionTitle from "@/components/common/SectionTitle";
import Loading from "@/components/vulcan-core/Loading";
import RejectionNotice from "@/components/posts/PostsPage/RejectionNotice";
import Button from "@/lib/vendor/@material-ui/core/src/Button";
import Checkbox from "@/lib/vendor/@material-ui/core/src/Checkbox";
import { Link } from "@/lib/reactRouterWrapper";
import { APPEAL_REASONS } from "@/lib/collections/rejectionAppeals/appealReasons";

const RejectedContentQuery = gql(`
  query RejectionAppealPageQuery($userId: String) {
    posts(selector: { rejected: { userId: $userId } }, limit: 50) {
      results {
        _id
        title
        rejectedReason
      }
    }
    comments(selector: { rejected: { userId: $userId } }, limit: 50) {
      results {
        _id
        rejectedReason
        post {
          _id
          title
        }
      }
    }
    rejectionAppeals(selector: { userAppeals: { userId: $userId } }, limit: 100) {
      results {
        ...RejectionAppealsUserInfo
      }
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
  root: {
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
    maxWidth: 680,
  },
  paragraph: {
    marginBottom: 16,
  },
  item: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: "10px 12px",
    borderBottom: theme.palette.border.faint,
  },
  itemStatus: {
    color: theme.palette.grey[600],
    fontSize: 13,
    whiteSpace: "nowrap",
  },
  checkboxRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: 4,
    marginBottom: 8,
    cursor: "pointer",
  },
  checkbox: {
    padding: 4,
    marginTop: -2,
  },
  textarea: {
    ...theme.typography.body2,
    width: "100%",
    minHeight: 200,
    padding: "8px 10px",
    border: theme.palette.border.faint,
    background: theme.palette.background.paper,
    color: theme.palette.text.normal,
    resize: "vertical",
  },
  buttons: {
    display: "flex",
    gap: 8,
    marginTop: 20,
  },
  error: {
    color: theme.palette.error.main,
    marginTop: 12,
  },
}));

type Step = "intro" | "pickContent" | "reasons" | "affirmations" | "explanation" | "done";

interface AppealableItem {
  postId: string | null;
  commentId: string | null;
  label: string;
  rejectedReason: string | null;
  appealStatus: RejectionAppealsUserInfo["status"] | null;
}

function getAppealableItems(data: ResultOf<typeof RejectedContentQuery> | undefined): AppealableItem[] {
  const appeals = data?.rejectionAppeals?.results ?? [];
  const postItems = (data?.posts?.results ?? []).map(post => ({
    postId: post._id,
    commentId: null,
    label: `Post: ${post.title}`,
    rejectedReason: post.rejectedReason,
    appealStatus: appeals.find(appeal => appeal.postId === post._id)?.status ?? null,
  }));
  const commentItems = (data?.comments?.results ?? []).map(comment => ({
    postId: null,
    commentId: comment._id,
    label: comment.post ? `Comment on ${comment.post.title}` : "Comment",
    rejectedReason: comment.rejectedReason,
    appealStatus: appeals.find(appeal => appeal.commentId === comment._id)?.status ?? null,
  }));
  return [...postItems, ...commentItems];
}

function getRequiredAffirmations(reasonIds: string[]): string[] {
  return APPEAL_REASONS
    .filter(reason => reasonIds.includes(reason.id))
    .flatMap(reason => reason.affirmations);
}

function toggle(values: string[], value: string): string[] {
  return values.includes(value)
    ? values.filter(v => v !== value)
    : [...values, value];
}

const CheckboxRow = ({ label, checked, onChange }: {
  label: string,
  checked: boolean,
  onChange: () => void,
}) => {
  const classes = useStyles(styles);
  return <label className={classes.checkboxRow}>
    <Checkbox className={classes.checkbox} checked={checked} onChange={onChange} disableRipple />
    <span>{label}</span>
  </label>;
};

const StepButtons = ({ onBack, onContinue, continueLabel = "Continue", continueDisabled = false }: {
  onBack?: () => void,
  onContinue: () => void,
  continueLabel?: string,
  continueDisabled?: boolean,
}) => {
  const classes = useStyles(styles);
  return <div className={classes.buttons}>
    {onBack && <Button onClick={onBack}>Back</Button>}
    <Button variant="contained" color="primary" onClick={onContinue} disabled={continueDisabled}>
      {continueLabel}
    </Button>
  </div>;
};

const IntroStep = ({ onContinue }: { onContinue: () => void }) => {
  const classes = useStyles(styles);
  return <div>
    <p className={classes.paragraph}>
      LessWrong moderators review a large volume of content from new users, and most rejections are not
      overturned. Appeals rarely succeed. Please only appeal if you believe the rejection was a clear mistake.
    </p>
    <p className={classes.paragraph}>
      Before appealing, please read the{" "}
      <Link to="/posts/LbbrnRvc9QwjJeics/new-user-s-guide-to-lesswrong">New User's Guide</Link>, including
      our policy on LLM-generated content.
    </p>
    <StepButtons onContinue={onContinue} />
  </div>;
};

const PickContentStep = ({ items, onPick, onBack }: {
  items: AppealableItem[],
  onPick: (item: AppealableItem) => void,
  onBack: () => void,
}) => {
  const classes = useStyles(styles);
  if (!items.length) {
    return <div>
      <p className={classes.paragraph}>You don't have any rejected posts or comments.</p>
      <StepButtons onContinue={onBack} continueLabel="Back" />
    </div>;
  }
  return <div>
    <p className={classes.paragraph}>Which rejected content would you like to appeal?</p>
    {items.map(item => (
      <div key={item.postId ?? item.commentId} className={classes.item}>
        <span>{item.label}</span>
        {item.appealStatus
          ? <span className={classes.itemStatus}>Appeal {item.appealStatus}</span>
          : <Button color="primary" onClick={() => onPick(item)}>Appeal</Button>}
      </div>
    ))}
    <div className={classes.buttons}>
      <Button onClick={onBack}>Back</Button>
    </div>
  </div>;
};

const ReasonsStep = ({ item, selectedReasonIds, onToggle, onBack, onContinue }: {
  item: AppealableItem,
  selectedReasonIds: string[],
  onToggle: (reasonId: string) => void,
  onBack: () => void,
  onContinue: () => void,
}) => {
  const classes = useStyles(styles);
  return <div>
    <RejectionNotice rejectedReason={item.rejectedReason} />
    <p className={classes.paragraph}>Select the reasons your content was rejected for:</p>
    {APPEAL_REASONS.map(reason => (
      <CheckboxRow
        key={reason.id}
        label={reason.label}
        checked={selectedReasonIds.includes(reason.id)}
        onChange={() => onToggle(reason.id)}
      />
    ))}
    <StepButtons onBack={onBack} onContinue={onContinue} continueDisabled={!selectedReasonIds.length} />
  </div>;
};

const AffirmationsStep = ({ affirmations, checkedAffirmations, onToggle, onBack, onContinue }: {
  affirmations: string[],
  checkedAffirmations: string[],
  onToggle: (affirmation: string) => void,
  onBack: () => void,
  onContinue: () => void,
}) => {
  const classes = useStyles(styles);
  const allChecked = affirmations.every(affirmation => checkedAffirmations.includes(affirmation));
  return <div>
    <p className={classes.paragraph}>I affirm that:</p>
    {affirmations.map(affirmation => (
      <CheckboxRow
        key={affirmation}
        label={affirmation}
        checked={checkedAffirmations.includes(affirmation)}
        onChange={() => onToggle(affirmation)}
      />
    ))}
    <StepButtons onBack={onBack} onContinue={onContinue} continueDisabled={!allChecked} />
  </div>;
};

const ExplanationStep = ({ explanation, onChange, onBack, onSubmit, submitting, error }: {
  explanation: string,
  onChange: (explanation: string) => void,
  onBack: () => void,
  onSubmit: () => void,
  submitting: boolean,
  error: string | null,
}) => {
  const classes = useStyles(styles);
  return <div>
    <p className={classes.paragraph}>
      Explain why you think the rejection was mistaken. Your explanation will be sent to the moderation team as a
      message, and their reply will appear in your inbox.
    </p>
    <textarea
      className={classes.textarea}
      value={explanation}
      onChange={(e) => onChange(e.target.value)}
    />
    {error && <div className={classes.error}>{error}</div>}
    <StepButtons
      onBack={onBack}
      onContinue={onSubmit}
      continueLabel={submitting ? "Submitting..." : "Submit appeal"}
      continueDisabled={submitting || !explanation.trim()}
    />
  </div>;
};

const RejectionAppealPage = () => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  const [step, setStep] = useState<Step>("intro");
  const [item, setItem] = useState<AppealableItem | null>(null);
  const [selectedReasonIds, setSelectedReasonIds] = useState<string[]>([]);
  const [checkedAffirmations, setCheckedAffirmations] = useState<string[]>([]);
  const [explanation, setExplanation] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data, loading, refetch } = useQuery(RejectedContentQuery, {
    variables: { userId: currentUser?._id },
    skip: !currentUser,
  });
  const [createAppeal, { loading: submitting }] = useMutation(CreateRejectionAppealMutation);

  if (!currentUser) {
    return <SingleColumnSection>You need to be logged in to appeal a rejection.</SingleColumnSection>;
  }
  if (loading && !data) {
    return <Loading />;
  }

  const items = getAppealableItems(data);
  const affirmations = getRequiredAffirmations(selectedReasonIds);

  const pickItem = (pickedItem: AppealableItem) => {
    setItem(pickedItem);
    setSelectedReasonIds([]);
    setCheckedAffirmations([]);
    setExplanation("");
    setStep("reasons");
  };

  const submit = async () => {
    if (!item) return;
    setError(null);
    try {
      await createAppeal({
        variables: { data: { postId: item.postId, commentId: item.commentId, explanation } },
      });
      await refetch();
      setStep("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong submitting your appeal.");
    }
  };

  return <SingleColumnSection>
    <SectionTitle title="Appeal a rejection" />
    <div className={classes.root}>
      {step === "intro" && <IntroStep onContinue={() => setStep("pickContent")} />}
      {step === "pickContent" && <PickContentStep items={items} onPick={pickItem} onBack={() => setStep("intro")} />}
      {step === "reasons" && item && <ReasonsStep
        item={item}
        selectedReasonIds={selectedReasonIds}
        onToggle={(reasonId) => setSelectedReasonIds(ids => toggle(ids, reasonId))}
        onBack={() => setStep("pickContent")}
        onContinue={() => setStep(affirmations.length ? "affirmations" : "explanation")}
      />}
      {step === "affirmations" && <AffirmationsStep
        affirmations={affirmations}
        checkedAffirmations={checkedAffirmations}
        onToggle={(affirmation) => setCheckedAffirmations(checked => toggle(checked, affirmation))}
        onBack={() => setStep("reasons")}
        onContinue={() => setStep("explanation")}
      />}
      {step === "explanation" && <ExplanationStep
        explanation={explanation}
        onChange={setExplanation}
        onBack={() => setStep(affirmations.length ? "affirmations" : "reasons")}
        onSubmit={() => void submit()}
        submitting={submitting}
        error={error}
      />}
      {step === "done" && <p className={classes.paragraph}>
        Your appeal has been sent to the moderation team. You'll receive their reply in your inbox.
      </p>}
    </div>
  </SingleColumnSection>;
};

export default RejectionAppealPage;
