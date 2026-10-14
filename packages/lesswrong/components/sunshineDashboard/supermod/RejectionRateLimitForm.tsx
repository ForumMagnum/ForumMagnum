import React from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { validateUserRateLimit } from '@/lib/collections/userRateLimits/helpers';

const RATE_LIMIT_UNITS = ['hours', 'days', 'weeks'] as const;
type RateLimitUnit = typeof RATE_LIMIT_UNITS[number];

const UNIT_LABELS: Record<RateLimitUnit, string> = {
  hours: 'hour',
  days: 'day',
  weeks: 'week',
};

interface ContentRateLimitSettings {
  // Blank means no limit on this type
  count: string;
  unit: RateLimitUnit;
  liftCount: string;
  liftKarma: string;
}

export interface RejectionRateLimitSettings {
  posts: ContentRateLimitSettings;
  comments: ContentRateLimitSettings;
}

type ContentKind = keyof RejectionRateLimitSettings;

const NOUNS: Record<ContentKind, { singular: string, plural: string }> = {
  posts: { singular: 'post', plural: 'posts' },
  comments: { singular: 'comment', plural: 'comments' },
};

export const DEFAULT_REJECTION_RATE_LIMIT_SETTINGS: RejectionRateLimitSettings = {
  posts: { count: '3', unit: 'weeks', liftCount: '3', liftKarma: '10' },
  comments: { count: '2', unit: 'days', liftCount: '10', liftKarma: '2' },
};

function parsePositiveNumber(value: string) {
  const number = Number(value);
  return value.trim() && Number.isFinite(number) && number > 0 ? number : null;
}

interface ActiveContentRateLimit {
  kind: ContentKind;
  count: number;
  unit: RateLimitUnit;
  liftCount: number;
  liftKarma: number;
}

function getActiveRateLimits(settings: RejectionRateLimitSettings): ActiveContentRateLimit[] {
  return (['posts', 'comments'] as const).flatMap(kind => {
    const { count, unit, liftCount, liftKarma } = settings[kind];
    if (!count.trim()) return [];
    if (!liftCount.trim() || !liftKarma.trim()) {
      throw new Error(`Complete the ${kind} karma-lift condition`);
    }
    const parsedCount = Number(count);
    if (parsedCount < 1) throw new Error(`${kind} per interval must be at least one; leave it blank for no limit`);
    const parsedLiftCount = Number(liftCount);
    const parsedLiftKarma = Number(liftKarma);
    validateUserRateLimit({ actionsPerInterval: parsedCount, intervalLength: 1, liftAtAverageKarma: parsedLiftKarma, liftAverageKarmaCount: parsedLiftCount });
    return [{ kind, count: parsedCount, unit, liftCount: parsedLiftCount, liftKarma: parsedLiftKarma }];
  });
}

export function getRejectionRateLimitError(settings: RejectionRateLimitSettings): string | null {
  try {
    getActiveRateLimits(settings);
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}

function describeRate({ kind, count, unit }: ActiveContentRateLimit) {
  const noun = count === 1 ? NOUNS[kind].singular : NOUNS[kind].plural;
  return `${count} ${noun} per ${UNIT_LABELS[unit]}`;
}

function describeLift({ kind, liftCount, liftKarma }: ActiveContentRateLimit) {
  return `your last ${liftCount} ${NOUNS[kind].plural} average at least ${liftKarma} karma`;
}

/** The paragraph announcing the limits in the rejection message, or null when no limit is set */
export function getRateLimitParagraphHtml(settings: RejectionRateLimitSettings): string | null {
  if (getRejectionRateLimitError(settings)) return null;
  const limits = getActiveRateLimits(settings);
  if (!limits.length) return null;
  const rates = limits.map(describeRate).join(' and ');
  const lifted = limits.filter(limit => limit.liftCount !== null);
  const liftSentence = lifted.length === 2
    ? ` The post limit lifts once ${describeLift(lifted[0])}, and the comment limit once ${describeLift(lifted[1])}.`
    : lifted.length === 1
      ? ` ${limits.length === 2 ? `The ${NOUNS[lifted[0].kind].singular} limit` : 'This'} lifts once ${describeLift(lifted[0])}.`
      : '';
  return `<p>I've also rate-limited your account to ${rates}.${liftSentence}</p>`;
}

export function getRateLimitsToCreate(settings: RejectionRateLimitSettings, userId: string): CreateUserRateLimitDataInput[] {
  return getActiveRateLimits(settings).map(limit => ({
    userId,
    type: limit.kind === 'posts' ? 'allPosts' : 'allComments',
    actionsPerInterval: limit.count,
    intervalLength: 1,
    intervalUnit: limit.unit,
    liftAtAverageKarma: limit.liftKarma,
    liftAverageKarmaCount: limit.liftCount,
  }));
}

const styles = defineStyles('RejectionRateLimitForm', (theme: ThemeType) => ({
  // A band nested under the "Rate limit" option, lined up with its label
  root: {
    marginLeft: 24,
    padding: '10px 12px',
    borderRadius: 4,
    backgroundColor: theme.palette.grey[100],
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    fontSize: 12,
    color: theme.palette.grey[700],
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    width: 64,
    color: theme.palette.grey[800],
  },
  liftRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    paddingLeft: 70,
    color: theme.palette.grey[600],
  },
  input: {
    width: 28,
    padding: '1px 3px',
    fontSize: 12,
    textAlign: 'center',
    border: `1px solid ${theme.palette.greyAlpha(0.13)}`,
    borderRadius: 3,
    backgroundColor: theme.palette.panelBackground.default,
    color: theme.palette.grey[900],
    // The global input:focus reset strips borders
    '&:focus': {
      border: `1px solid ${theme.palette.greyAlpha(0.3)}`,
    },
    // The spinner arrows take up most of a field this narrow
    MozAppearance: 'textfield',
    '&::-webkit-inner-spin-button, &::-webkit-outer-spin-button': {
      WebkitAppearance: 'none',
      margin: 0,
    },
  },
  select: {
    fontSize: 12,
    padding: '1px 2px',
    border: `1px solid ${theme.palette.greyAlpha(0.13)}`,
    borderRadius: 3,
    backgroundColor: theme.palette.panelBackground.default,
    color: theme.palette.grey[900],
  },
}));

const ContentRateLimitFields = ({ kind, settings, onChange }: {
  kind: ContentKind;
  settings: ContentRateLimitSettings;
  onChange: (settings: ContentRateLimitSettings) => void;
}) => {
  const classes = useStyles(styles);
  const isSet = parsePositiveNumber(settings.count) !== null;
  return <>
    <div className={classes.row}>
      <span className={classes.label}>{kind === 'posts' ? 'Posts' : 'Comments'}</span>
      <input
        className={classes.input}
        type="number"
        min={1}
        placeholder="–"
        value={settings.count}
        onChange={(e) => onChange({ ...settings, count: e.target.value })}
      />
      <span>per</span>
      <select
        className={classes.select}
        value={settings.unit}
        onChange={(e) => onChange({ ...settings, unit: RATE_LIMIT_UNITS.find(unit => unit === e.target.value) ?? settings.unit })}
      >
        {RATE_LIMIT_UNITS.map(unit => <option key={unit} value={unit}>{UNIT_LABELS[unit]}</option>)}
      </select>
    </div>
    {isSet && <div className={classes.liftRow}>
      <span>lifts when last</span>
      <input
        className={classes.input}
        type="number"
        min={1}
        value={settings.liftCount}
        onChange={(e) => onChange({ ...settings, liftCount: e.target.value })}
      />
      <span>{NOUNS[kind].plural} average ≥</span>
      <input
        className={classes.input}
        type="number"
        value={settings.liftKarma}
        onChange={(e) => onChange({ ...settings, liftKarma: e.target.value })}
      />
      <span>karma</span>
    </div>}
  </>;
};

function preventEnterSubmit(event: React.KeyboardEvent) {
  if (event.key === 'Enter' && !event.metaKey && !event.ctrlKey) {
    event.preventDefault();
  }
}

const RejectionRateLimitForm = ({ settings, onChange }: {
  settings: RejectionRateLimitSettings;
  onChange: (settings: RejectionRateLimitSettings) => void;
}) => {
  const classes = useStyles(styles);
  // Inside the message form, Enter in a field would otherwise send the message
  const error = getRejectionRateLimitError(settings);
  return <div className={classes.root} onKeyDown={preventEnterSubmit}>
    {error && <div role="alert">{error}</div>}
    <ContentRateLimitFields kind="posts" settings={settings.posts} onChange={(posts) => onChange({ ...settings, posts })} />
    <ContentRateLimitFields kind="comments" settings={settings.comments} onChange={(comments) => onChange({ ...settings, comments })} />
  </div>;
};

export default RejectionRateLimitForm;
