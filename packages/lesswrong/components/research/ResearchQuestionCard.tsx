'use client';

import React, { useCallback, useMemo, useState } from 'react';
import classNames from 'classnames';
import { gql } from '@/lib/generated/gql-codegen';
import { useMutation } from '@apollo/client/react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { useMessages } from '@/components/common/withMessages';
import {
  researchChatSans,
  researchChatSurface,
  researchInputBackground,
  researchMono,
  researchRadius,
  researchSquircle,
  researchTransition,
  researchWarmAlpha,
} from './researchStyleUtils';
import type { AskUserQuestionItem, AskUserQuestionPrompt } from './researchAskUserQuestion';

const AnswerResearchQuestionMutation = gql(`
  mutation AnswerResearchConversationQuestion($conversationId: String!, $toolUseId: String!, $answersJson: String!) {
    answerResearchConversationQuestion(conversationId: $conversationId, toolUseId: $toolUseId, answersJson: $answersJson) {
      ok
      expired
    }
  }
`);

const OTHER = '__other__';

const styles = defineStyles('ResearchQuestionCard', (theme: ThemeType) => ({
  root: {
    margin: '8px 0',
    padding: '12px 14px 14px',
    background: researchChatSurface(theme),
    border: `1px solid ${researchWarmAlpha(0.14)}`,
    borderRadius: researchRadius.lg,
    ...researchSquircle,
    fontFamily: researchChatSans,
  },
  headerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    marginBottom: 10,
  },
  headerGlyph: {
    fontFamily: researchMono,
    fontSize: 12,
    color: theme.palette.primary.main,
    userSelect: 'none',
  },
  headerLabel: {
    fontFamily: researchMono,
    fontSize: 10.5,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: researchWarmAlpha(0.5),
  },
  question: {
    marginBottom: 12,
    '&:last-of-type': { marginBottom: 0 },
  },
  questionText: {
    fontSize: 14,
    lineHeight: 1.45,
    color: theme.palette.text.primary,
    marginBottom: 8,
  },
  options: {
    display: 'flex',
    flexDirection: 'column',
    gap: 5,
  },
  option: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
    width: '100%',
    textAlign: 'left',
    padding: '7px 10px',
    border: `1px solid ${researchWarmAlpha(0.14)}`,
    borderRadius: researchRadius.sm,
    ...researchSquircle,
    background: researchInputBackground(theme),
    color: theme.palette.text.primary,
    cursor: 'pointer',
    fontFamily: researchChatSans,
    fontSize: 13,
    lineHeight: 1.4,
    transition: `border-color ${researchTransition}, background ${researchTransition}`,
    '&:hover': {
      borderColor: researchWarmAlpha(0.3),
    },
  },
  optionSelected: {
    borderColor: theme.palette.primary.main,
    background: researchWarmAlpha(0.04),
  },
  optionDisabled: {
    cursor: 'default',
    opacity: 0.75,
    '&:hover': { borderColor: researchWarmAlpha(0.14) },
  },
  optionMark: {
    flex: 'none',
    marginTop: 1,
    width: 14,
    height: 14,
    fontFamily: researchMono,
    fontSize: 11,
    lineHeight: '14px',
    textAlign: 'center',
    color: theme.palette.primary.main,
    userSelect: 'none',
  },
  optionBody: {
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
  },
  optionLabel: {
    fontWeight: 600,
  },
  optionDescription: {
    color: theme.palette.text.dim,
    fontSize: 12,
  },
  otherInput: {
    marginTop: 5,
    width: '100%',
    boxSizing: 'border-box',
    border: `1px solid ${researchWarmAlpha(0.16)}`,
    borderRadius: researchRadius.sm,
    background: researchInputBackground(theme),
    color: theme.palette.text.primary,
    fontFamily: researchChatSans,
    fontSize: 13,
    padding: '6px 9px',
    outline: 'none',
    '&:focus': { borderColor: theme.palette.primary.main },
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
  },
  submit: {
    border: 'none',
    borderRadius: researchRadius.sm,
    ...researchSquircle,
    background: theme.palette.primary.main,
    color: theme.palette.text.alwaysWhite ?? '#fff',
    fontFamily: researchChatSans,
    fontSize: 13,
    fontWeight: 600,
    padding: '6px 16px',
    cursor: 'pointer',
    transition: `opacity ${researchTransition}`,
    '&:hover': { opacity: 0.9 },
    '&:disabled': { opacity: 0.45, cursor: 'default' },
  },
  note: {
    fontFamily: researchMono,
    fontSize: 11,
    color: theme.palette.text.dim,
  },
  noteExpired: {
    fontStyle: 'italic',
  },
  answeredValue: {
    color: theme.palette.text.dim,
  },
}));

type Selection = {
  labels: Set<string>;
  otherChosen: boolean;
  otherText: string;
};

function emptySelection(): Selection {
  return { labels: new Set(), otherChosen: false, otherText: '' };
}

function answerForQuestion(q: AskUserQuestionItem, sel: Selection): string {
  const parts = q.options.filter((o) => sel.labels.has(o.label)).map((o) => o.label);
  if (sel.otherChosen && sel.otherText.trim()) parts.push(sel.otherText.trim());
  return parts.join(', ');
}

interface ResearchQuestionCardProps {
  conversationId: string;
  prompt: AskUserQuestionPrompt;
  answers: Record<string, string> | null;
  actionable: boolean;
}

export const ResearchQuestionCard = ({ conversationId, prompt, answers, actionable }: ResearchQuestionCardProps) => {
  const classes = useStyles(styles);
  const { flash } = useMessages();
  const [answerQuestion] = useMutation(AnswerResearchQuestionMutation);
  const [selections, setSelections] = useState<Record<number, Selection>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const answered = answers !== null;
  const expired = !answered && !actionable;

  const getSel = useCallback((i: number): Selection => selections[i] ?? emptySelection(), [selections]);

  const toggleOption = useCallback((qi: number, q: AskUserQuestionItem, label: string) => {
    setSelections((prev) => {
      const cur = prev[qi] ?? emptySelection();
      const labels = new Set(cur.labels);
      let { otherChosen } = cur;
      if (q.multiSelect) {
        if (labels.has(label)) labels.delete(label);
        else labels.add(label);
      } else {
        labels.clear();
        labels.add(label);
        otherChosen = false;
      }
      return { ...prev, [qi]: { ...cur, labels, otherChosen } };
    });
  }, []);

  const toggleOther = useCallback((qi: number, q: AskUserQuestionItem) => {
    setSelections((prev) => {
      const cur = prev[qi] ?? emptySelection();
      const otherChosen = !cur.otherChosen;
      const labels = q.multiSelect ? cur.labels : new Set<string>();
      return { ...prev, [qi]: { ...cur, otherChosen, labels } };
    });
  }, []);

  const setOtherText = useCallback((qi: number, text: string) => {
    setSelections((prev) => {
      const cur = prev[qi] ?? emptySelection();
      return { ...prev, [qi]: { ...cur, otherText: text, otherChosen: true } };
    });
  }, []);

  const allAnswered = useMemo(
    () => prompt.questions.every((q, i) => answerForQuestion(q, getSel(i)).length > 0),
    [prompt.questions, getSel],
  );

  const handleSubmit = useCallback(async () => {
    if (submitting || !allAnswered) return;
    const answerMap: Record<string, string> = {};
    prompt.questions.forEach((q, i) => { answerMap[q.question] = answerForQuestion(q, getSel(i)); });
    setSubmitting(true);
    try {
      const result = await answerQuestion({
        variables: { conversationId, toolUseId: prompt.toolUseId, answersJson: JSON.stringify(answerMap) },
      });
      const data = result.data?.answerResearchConversationQuestion;
      if (data?.expired) {
        setSubmitted(true);
        flash({ messageString: 'This question expired — reply normally to continue.', type: 'error' });
      } else if (data?.ok) {
        setSubmitted(true);
      } else {
        flash({ messageString: 'Could not submit the answer.', type: 'error' });
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[research] answer question failed', err);
      flash({ messageString: `Failed to submit answer: ${(err as Error).message}`, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  }, [submitting, allAnswered, prompt.questions, prompt.toolUseId, getSel, answerQuestion, conversationId, flash]);

  const interactive = actionable && !answered && !submitted;

  return (
    <div className={classes.root}>
      <div className={classes.headerRow}>
        <span className={classes.headerGlyph}>?</span>
        <span className={classes.headerLabel}>Question{prompt.questions.length > 1 ? 's' : ''} for you</span>
      </div>

      {prompt.questions.map((q, qi) => {
        const sel = getSel(qi);
        const answeredValue = answers?.[q.question];
        return (
          <div key={qi} className={classes.question}>
            <div className={classes.questionText}>{q.question}</div>
            {answered ? (
              <div className={classes.note}>
                <span className={classes.answeredValue}>{answeredValue ?? '—'}</span>
              </div>
            ) : (
              <div className={classes.options}>
                {q.options.map((opt) => {
                  const selected = sel.labels.has(opt.label);
                  return (
                    <button
                      key={opt.label}
                      type="button"
                      disabled={!interactive}
                      className={classNames(classes.option, {
                        [classes.optionSelected]: selected,
                        [classes.optionDisabled]: !interactive,
                      })}
                      onClick={() => toggleOption(qi, q, opt.label)}
                    >
                      <span className={classes.optionMark}>
                        {selected ? (q.multiSelect ? '☑' : '●') : (q.multiSelect ? '☐' : '○')}
                      </span>
                      <span className={classes.optionBody}>
                        <span className={classes.optionLabel}>{opt.label}</span>
                        {opt.description ? <span className={classes.optionDescription}>{opt.description}</span> : null}
                      </span>
                    </button>
                  );
                })}
                <button
                  type="button"
                  disabled={!interactive}
                  className={classNames(classes.option, {
                    [classes.optionSelected]: sel.otherChosen,
                    [classes.optionDisabled]: !interactive,
                  })}
                  onClick={() => toggleOther(qi, q)}
                >
                  <span className={classes.optionMark}>
                    {sel.otherChosen ? (q.multiSelect ? '☑' : '●') : (q.multiSelect ? '☐' : '○')}
                  </span>
                  <span className={classes.optionBody}>
                    <span className={classes.optionLabel}>Other</span>
                  </span>
                </button>
                {sel.otherChosen && interactive ? (
                  <input
                    type="text"
                    className={classes.otherInput}
                    placeholder="Type your answer…"
                    value={sel.otherText}
                    onChange={(e) => setOtherText(qi, e.target.value)}
                    autoFocus
                  />
                ) : null}
              </div>
            )}
          </div>
        );
      })}

      {!answered ? (
        <div className={classes.footer}>
          {expired ? (
            <span className={classNames(classes.note, classes.noteExpired)}>
              This question expired — reply normally to continue.
            </span>
          ) : (
            <>
              <button
                type="button"
                className={classes.submit}
                disabled={!interactive || !allAnswered || submitting}
                onClick={handleSubmit}
              >
                {submitting ? 'Sending…' : 'Submit'}
              </button>
              {submitted ? <span className={classes.note}>Sent — continuing…</span> : null}
            </>
          )}
        </div>
      ) : null}
    </div>
  );
};
