import React, { useCallback, useMemo, useState } from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { useObserver } from '@/components/hooks/useObserver';
import { useQuery } from '@/lib/crud/useQuery';
import { gql } from '@/lib/generated/gql-codegen';
import {
  CommentNotificationFacts,
  CommentNotificationFilterParseResult,
  evaluateCommentNotificationFilter,
  parseCommentNotificationFilter,
} from '@/lib/collections/users/commentNotificationFilter';
import SettingsSaveButton from './SettingsSaveButton';
import type { EditableUser } from '@/lib/collections/users/helpers';
import type { UpdateUserSettings } from './useAutoSavedUserSettings';

const CommentNotificationFilterHistoryQuery = gql(`
  query CommentNotificationFilterSettingsHistory($userId: String!) {
    commentNotificationFilterHistory(userId: $userId) {
      commentKarma
      commenterKarma
      commenterIsFollowed
      topLevelOnMyPost
      downthreadOnMyPost
      replyToMyComment
    }
  }
`);

const SUGGESTED_FILTERS = [
  {
    name: 'Most replies',
    description: 'Comments on your posts and direct replies to you, plus anything else that gets upvoted',
    expression: 'topLevelOnMyPost or replyToMyComment or commenterIsFollowed or commentKarma >= 5',
  },
  {
    name: 'Established commenters',
    description: 'Comments on your posts and direct replies from high-karma users, plus anything that does well',
    expression: 'commenterIsFollowed or commentKarma >= 10 or ((topLevelOnMyPost or replyToMyComment) and commenterKarma >= 1000)',
  },
  {
    name: 'Well-received',
    description: 'Only replies that do well, and replies from people you follow',
    expression: 'commenterIsFollowed or commentKarma >= 15',
  },
  {
    name: 'Standouts',
    description: 'Only highly upvoted replies, and direct replies from people you follow',
    expression: 'commentKarma >= 30 or (commenterIsFollowed and replyToMyComment)',
  },
];

const FILTER_VARIABLES = [
  { name: 'commentKarma', description: "the reply's karma" },
  { name: 'commenterKarma', description: "the replier's total karma" },
  { name: 'commenterIsFollowed', description: 'you follow the replier' },
  { name: 'topLevelOnMyPost', description: 'a top-level comment on your post' },
  { name: 'downthreadOnMyPost', description: 'a reply to a comment on your post' },
  { name: 'replyToMyComment', description: 'a direct reply to your comment' },
];

const styles = defineStyles('CommentNotificationFilterSettings', (theme: ThemeType) => ({
  option: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    padding: '12px 0',
    borderBottom: `1px solid ${theme.palette.greyAlpha(0.06)}`,
    cursor: 'pointer',
    '&:last-child': {
      borderBottom: 'none',
    },
  },
  radio: {
    marginTop: 3,
    accentColor: theme.palette.primary.main,
    cursor: 'pointer',
  },
  optionBody: {
    flex: 1,
    minWidth: 0,
    fontFamily: theme.typography.fontFamily,
  },
  optionHeader: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 16,
  },
  optionName: {
    fontSize: 14,
    fontWeight: 500,
    color: theme.palette.grey[800],
    lineHeight: 1.4,
  },
  count: {
    fontSize: 12.5,
    color: theme.palette.grey[600],
    whiteSpace: 'nowrap',
  },
  description: {
    fontSize: 12.5,
    color: theme.palette.grey[500],
    lineHeight: 1.45,
    marginTop: 2,
  },
  expression: {
    ...theme.typography.code,
    display: 'block',
    fontSize: 11.5,
    color: theme.palette.grey[600],
    padding: '3px 6px',
    marginTop: 4,
    overflowWrap: 'anywhere',
  },
  customEditor: {
    marginTop: 8,
    cursor: 'auto',
  },
  input: {
    fontFamily: theme.typography.code.fontFamily,
    lineHeight: 1.42,
    display: 'block',
    width: '100%',
    boxSizing: 'border-box',
    border: `1px solid ${theme.palette.greyAlpha(0.15)}`,
    borderRadius: 6,
    padding: '9px 12px',
    fontSize: 13,
    color: theme.palette.grey[900],
    background: theme.palette.panelBackground.default,
    resize: 'vertical',
    '&:focus': {
      outline: 'none',
      borderColor: theme.palette.primary.main,
    },
  },
  error: {
    fontSize: 12.5,
    color: theme.palette.error.main,
    marginTop: 6,
  },
  estimate: {
    fontSize: 12.5,
    color: theme.palette.grey[600],
    marginTop: 6,
  },
  saveRow: {
    marginTop: 8,
  },
  help: {
    fontSize: 12.5,
    color: theme.palette.grey[500],
    lineHeight: 1.5,
    marginTop: 10,
  },
  helpList: {
    margin: '4px 0',
    paddingLeft: 18,
  },
  helpName: {
    ...theme.typography.code,
    fontSize: 11.5,
    padding: '1px 3px',
  },
}));

function countPassing(history: CommentNotificationFacts[], parsed: CommentNotificationFilterParseResult): number | null {
  if (!parsed.valid) return null;
  return history.filter(facts => evaluateCommentNotificationFilter(parsed.expression, facts)).length;
}

const CommentNotificationFilterOption = ({ name, description, expression, count, selected, onSelect, children }: {
  name: string;
  description?: string;
  expression?: string;
  count: number | null;
  selected: boolean;
  onSelect: () => void;
  children?: React.ReactNode;
}) => {
  const classes = useStyles(styles);
  return (
    <label className={classes.option}>
      <input
        type="radio"
        name="commentNotificationFilter"
        className={classes.radio}
        checked={selected}
        onChange={onSelect}
      />
      <div className={classes.optionBody}>
        <div className={classes.optionHeader}>
          <span className={classes.optionName}>{name}</span>
          {count !== null && <span className={classes.count}>{count} in the past week</span>}
        </div>
        {description && <div className={classes.description}>{description}</div>}
        {expression && <code className={classes.expression}>{expression}</code>}
        {children}
      </div>
    </label>
  );
};

const CommentNotificationFilterSettings = ({ settings, updateSettings }: {
  settings: EditableUser;
  updateSettings: UpdateUserSettings;
}) => {
  const classes = useStyles(styles);
  const savedFilter = settings.commentNotificationFilter ?? null;
  const savedFilterIsCustom = savedFilter !== null && !SUGGESTED_FILTERS.some(f => f.expression === savedFilter);

  const [isEditingCustom, setIsEditingCustom] = useState(false);
  const [draft, setDraft] = useState(savedFilter ?? '');
  const [saving, setSaving] = useState(false);

  // Every settings tab is always mounted, so wait until this one is on screen
  const [hasBeenVisible, setHasBeenVisible] = useState(false);
  const handleBecameVisible = useCallback(() => setHasBeenVisible(true), []);
  const rootRef = useObserver<HTMLDivElement>({ onEnter: handleBecameVisible, threshold: 0, maxTriggers: 1 });

  const { data } = useQuery(CommentNotificationFilterHistoryQuery, {
    variables: { userId: settings._id },
    skip: !hasBeenVisible,
    ssr: false,
  });
  const history = data?.commentNotificationFilterHistory ?? null;

  const parsedDraft = useMemo(() => parseCommentNotificationFilter(draft), [draft]);
  const customSelected = isEditingCustom || savedFilterIsCustom;
  const draftIsUnsaved = draft.trim() !== savedFilter;

  const selectSavedFilter = (filter: string | null) => {
    setIsEditingCustom(false);
    void updateSettings({ commentNotificationFilter: filter });
  };

  const selectCustom = () => {
    setDraft(savedFilter ?? '');
    setIsEditingCustom(true);
  };

  const saveDraft = async () => {
    setSaving(true);
    await updateSettings({ commentNotificationFilter: draft.trim() });
    setSaving(false);
  };

  const countFor = (expression: string) => history && countPassing(history, parseCommentNotificationFilter(expression));
  const draftCount = history && countPassing(history, parsedDraft);

  return (
    <div ref={rootRef}>
      <CommentNotificationFilterOption
        name="All replies"
        description="No filter"
        count={history && history.length}
        selected={!customSelected && savedFilter === null}
        onSelect={() => selectSavedFilter(null)}
      />
      {SUGGESTED_FILTERS.map(filter => (
        <CommentNotificationFilterOption
          key={filter.name}
          name={filter.name}
          description={filter.description}
          expression={filter.expression}
          count={countFor(filter.expression)}
          selected={!customSelected && savedFilter === filter.expression}
          onSelect={() => selectSavedFilter(filter.expression)}
        />
      ))}
      <CommentNotificationFilterOption
        name="Custom"
        description="Write your own expression"
        count={customSelected ? draftCount : null}
        selected={customSelected}
        onSelect={selectCustom}
      >
        {customSelected && <div className={classes.customEditor}>
          <textarea
            className={classes.input}
            rows={2}
            value={draft}
            placeholder="commentKarma >= 10 or commenterIsFollowed"
            onChange={(e) => setDraft(e.target.value)}
          />
          {!parsedDraft.valid && draft.trim() !== '' && <div className={classes.error}>{parsedDraft.error}</div>}
          {parsedDraft.valid && draftCount !== null && <div className={classes.estimate}>
            This would have sent {draftCount} of the {history?.length} notifications you could have gotten in the past week.
          </div>}
          {parsedDraft.valid && draftIsUnsaved && <div className={classes.saveRow}>
            <SettingsSaveButton saving={saving} onClick={() => void saveDraft()} />
          </div>}
          <div className={classes.help}>
            Combine these with <code className={classes.helpName}>and</code>, <code className={classes.helpName}>or</code>, <code className={classes.helpName}>not</code> and parentheses. Compare numbers with <code className={classes.helpName}>{'>= <= > < == !='}</code>.
            <ul className={classes.helpList}>
              {FILTER_VARIABLES.map(variable => <li key={variable.name}>
                <code className={classes.helpName}>{variable.name}</code>: {variable.description}
              </li>)}
            </ul>
          </div>
        </div>}
      </CommentNotificationFilterOption>
    </div>
  );
};

export default CommentNotificationFilterSettings;
