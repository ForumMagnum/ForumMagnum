import React, { useMemo, useState } from 'react';
import moment from 'moment';
import classNames from 'classnames';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { useQuery } from '@/lib/crud/useQuery';
import { gql } from '@/lib/generated/gql-codegen';
import { useCurrentTime } from '@/lib/utils/timeUtil';
import { useLocalStorageState } from '@/components/hooks/useLocalStorageState';
import { htmlToTextDefault } from '@/lib/htmlToText';
import { prettyScrollbars } from '@/themes/styleUtils';
import { Link } from '@/lib/reactRouterWrapper';
import {
  allRateLimits,
  AUTO_BLOCKED_FROM_SENDING_DMS,
  AUTO_PURGED_LLM_REJECTED_SPAM,
  AUTO_PURGED_PROFILE_SPAM,
  AUTO_REMOVED_LLM_REJECTED_USER,
  EXEMPT_FROM_RATE_LIMITS,
  FLAGGED_FOR_N_DMS,
  LOW_AVERAGE_KARMA_COMMENT_ALERT,
  LOW_AVERAGE_KARMA_POST_ALERT,
  MANUAL_FLAG_ALERT,
  MANUAL_NEEDS_REVIEW,
  MODERATOR_ACTION_TYPES,
  MOVED_POST_TO_DRAFT,
  NEGATIVE_KARMA_USER_ALERT,
  POTENTIAL_TARGETED_DOWNVOTING,
  RECEIVED_SENIOR_DOWNVOTES_ALERT,
  RECEIVED_VOTING_PATTERN_WARNING,
  RECENTLY_DOWNVOTED_CONTENT_ALERT,
  REJECTED_COMMENT,
  REJECTED_POST,
  SENT_MODERATOR_MESSAGE,
  SNOOZE_EXPIRED,
  STRICTER_COMMENT_AUTOMOD_RATE_LIMIT,
  STRICTER_POST_AUTOMOD_RATE_LIMIT,
  UNREVIEWED_BIO_UPDATE,
  UNREVIEWED_COMMENT,
  UNREVIEWED_FIRST_COMMENT,
  UNREVIEWED_FIRST_POST,
  UNREVIEWED_MAP_LOCATION_UPDATE,
  UNREVIEWED_POST,
  UNREVIEWED_PROFILE_IMAGE_UPDATE,
  VOTING_DISABLED,
} from '@/lib/collections/moderatorActions/constants';
import EmailIcon from '@/lib/vendor/@material-ui/icons/src/Email';
import NotesIcon from '@/lib/vendor/@material-ui/icons/src/Notes';
import FlagIcon from '@/lib/vendor/@material-ui/icons/src/Flag';
import TimerIcon from '@/lib/vendor/@material-ui/icons/src/Timer';
import AccessTimeIcon from '@/lib/vendor/@material-ui/icons/src/AccessTime';
import NotInterestedIcon from '@/lib/vendor/@material-ui/icons/src/NotInterested';
import CheckIcon from '@/lib/vendor/@material-ui/icons/src/Check';
import VisibilityIcon from '@/lib/vendor/@material-ui/icons/src/Visibility';
import CheckCircleOutlineIcon from '@/lib/vendor/@material-ui/icons/src/CheckCircleOutline';
import ForumIcon from '@/components/common/ForumIcon';
import LWTooltip from '@/components/common/LWTooltip';
import FormatDate from '@/components/common/FormatDate';
import UsersName from '@/components/users/UsersName';
import ConversationPreview from '@/components/messaging/ConversationPreview';
import { getKarmaLiftDescription, getRateLimitDescription } from '../UserRateLimitItem';
import ModerationSectionTitle from './ModerationSectionTitle';
import ModeratorNoteComposer from './ModeratorNoteComposer';
import { parseModeratorNotes, type ModeratorNoteEntry } from './parseModeratorNotes';
import type { InboxAction } from './inboxReducer';

const ModeratorConversationsQuery = gql(`
  query multiConversationModerationActivityFeedQuery($selector: ConversationSelector, $limit: Int) {
    conversations(selector: $selector, limit: $limit) {
      results {
        ...ConversationsList
      }
    }
  }
`);

const FirstMessageQuery = gql(`
  query firstMessageModerationActivityFeedQuery($selector: MessageSelector, $limit: Int) {
    messages(selector: $selector, limit: $limit) {
      results {
        ...messageListFragment
      }
    }
  }
`);

const styles = defineStyles('ModerationActivityFeed', (theme: ThemeType) => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  noiseFilter: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 11,
    color: theme.palette.grey[600],
    cursor: 'pointer',
    '& input': {
      margin: 0,
      accentColor: theme.palette.grey[500],
      opacity: 0.8,
    },
  },
  item: {
    display: 'grid',
    gridTemplateColumns: '78px 14px minmax(0, 1fr)',
    columnGap: 8,
    alignItems: 'baseline',
    padding: '5px 6px',
    marginBottom: 2,
    borderRadius: 3,
    fontSize: 11.5,
    lineHeight: 1.3,
    color: theme.palette.grey[800],
  },
  human: {
    fontWeight: 600,
  },
  humanRow: {
    backgroundColor: theme.palette.greyAlpha(0.06),
    '& $author': {
      fontWeight: 500,
      color: theme.palette.grey[900],
    },
  },
  pendingRow: {
    backgroundColor: 'light-dark(#fdf1d6, rgba(224,165,38,0.25))',
    color: 'light-dark(#8a5a00, #e0a526)',
    fontWeight: 600,
    '& $icon': {
      color: 'inherit',
    },
  },
  automated: {
    fontSize: 10.5,
    opacity: 0.7,
    backgroundColor: theme.palette.greyAlpha(0.025),
    '& $author': {
      color: theme.palette.grey[500],
    },
  },
  messageSnippet: {
    marginTop: 4,
    fontSize: 10.5,
    fontWeight: 400,
    color: theme.palette.grey[700],
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  restrictive: {
    color: theme.palette.error.main,
  },
  approval: {
    color: theme.palette.primary.main,
  },
  icon: {
    width: 13,
    height: 13,
    color: theme.palette.grey[500],
    position: 'relative',
    top: 2,
  },
  keyIcon: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    fontWeight: 700,
    lineHeight: 1,
    color: theme.palette.grey[600],
  },
  body: {
    whiteSpace: 'pre-wrap',
    overflowWrap: 'anywhere',
  },
  secondary: {
    color: theme.palette.grey[500],
  },
  noWrap: {
    whiteSpace: 'nowrap',
  },
  meta: {
    fontSize: 11,
    color: theme.palette.grey[600],
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  date: {
    display: 'inline-block',
    minWidth: 30,
  },
  author: {
    color: theme.palette.grey[800],
    fontWeight: 500,
  },
  conversationHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    cursor: 'pointer',
  },
  conversationIcon: {
    height: 12,
    width: 12,
    color: theme.palette.grey[600],
    '&:hover': {
      opacity: 0.7,
    },
  },
  conversationPreview: {
    gridColumn: '1 / -1',
    marginTop: 6,
    padding: 6,
    borderRadius: 3,
    backgroundColor: theme.palette.background.paper,
    maxHeight: 400,
    overflowY: 'auto',
    ...prettyScrollbars(theme),
    fontWeight: 400,
    '& .ConversationPreview-root': {
      padding: 0,
      maxWidth: 'none',
    },
    '& .MessageItem-root': {
      maxWidth: '100%',
      width: 'auto',
      marginBottom: 6,
    },
    '& .MessageItem-message': {
      padding: '4px 8px',
    },
    '& .MessageItem-backgroundIsCurrent': {
      marginLeft: 0,
    },
    '& .MessageItem-meta': {
      marginBottom: 2,
      fontSize: 11,
    },
    '& .MessageItem-messageBody, & .MessageItem-messageBody p, & .MessageItem-messageBody li': {
      fontSize: 12,
      lineHeight: 1.4,
    },
    '& .MessageItem-messageBody p': {
      marginTop: 0,
      marginBottom: '0.5em',
    },
  },
  conversationPreviewTooltip: {
    maxHeight: '100vh',
    overflow: 'hidden',
  },
}));

// Triggered by the user's own activity or by karma heuristics, rather than by a moderator or classifier
const HIDDEN_ACTION_TYPES = new Set<string>([
  UNREVIEWED_FIRST_POST,
  UNREVIEWED_FIRST_COMMENT,
  UNREVIEWED_POST,
  UNREVIEWED_COMMENT,
  UNREVIEWED_BIO_UPDATE,
  UNREVIEWED_MAP_LOCATION_UPDATE,
  UNREVIEWED_PROFILE_IMAGE_UPDATE,
  RECENTLY_DOWNVOTED_CONTENT_ALERT,
  LOW_AVERAGE_KARMA_COMMENT_ALERT,
  LOW_AVERAGE_KARMA_POST_ALERT,
  NEGATIVE_KARMA_USER_ALERT,
  RECEIVED_SENIOR_DOWNVOTES_ALERT,
  POTENTIAL_TARGETED_DOWNVOTING,
]);

const RESTRICTIVE_ACTION_TYPES = new Set<string>([
  ...allRateLimits,
  RECEIVED_VOTING_PATTERN_WARNING,
  FLAGGED_FOR_N_DMS,
  AUTO_BLOCKED_FROM_SENDING_DMS,
  REJECTED_POST,
  REJECTED_COMMENT,
  MOVED_POST_TO_DRAFT,
  MANUAL_FLAG_ALERT,
  VOTING_DISABLED,
  STRICTER_COMMENT_AUTOMOD_RATE_LIMIT,
  STRICTER_POST_AUTOMOD_RATE_LIMIT,
  AUTO_PURGED_PROFILE_SPAM,
  AUTO_REMOVED_LLM_REJECTED_USER,
  AUTO_PURGED_LLM_REJECTED_SPAM,
]);

const APPROVAL_ACTION_TYPES = new Set<string>([EXEMPT_FROM_RATE_LIMITS]);

// Actions only a moderator can take, for when no note names who took them
const MODERATOR_ONLY_ACTION_TYPES = new Set<string>([
  MANUAL_NEEDS_REVIEW,
  MANUAL_FLAG_ALERT,
  MOVED_POST_TO_DRAFT,
  REJECTED_POST,
  REJECTED_COMMENT,
  VOTING_DISABLED,
  EXEMPT_FROM_RATE_LIMITS,
  SENT_MODERATOR_MESSAGE,
]);

// Creating a moderator action also writes a note of just its quoted label
const ACTION_TYPE_BY_QUOTED_LABEL = new Map<string, string>(
  Object.entries(MODERATOR_ACTION_TYPES).map(([type, label]) => [`"${label}"`, type]),
);

// The signature automatic notes are written under when no moderator is responsible
const AUTOMOD_AUTHOR = 'Automod';

// Notes are signed to the minute, so the notes written alongside an action land within a minute or two of it.
// Older signatures have only a date, not always in Pacific time, so they match anything within a day.
const NOTE_MATCH_WINDOW_MS = 2 * 60 * 1000;
const DATE_ONLY_NOTE_MATCH_WINDOW_MS = 24 * 60 * 60 * 1000;
const TIME_OF_DAY = /\d:\d{2}/;
const AUTOMOD_RATE_LIMIT_TYPES = new Set<string>([STRICTER_COMMENT_AUTOMOD_RATE_LIMIT, STRICTER_POST_AUTOMOD_RATE_LIMIT]);
const AUTOMOD_RATE_LIMIT_NOTE = /^User triggered a stricter (.+) rate limit$/;

const APPROVE_CURRENT_ONLY_EXPLANATION = / \(future content will need review\)$/;

type IconComponent = React.ComponentType<{ className?: string }>;

// Removing a user from the queue is the Q shortcut
const RemovedFromQueueIcon = ({ className }: { className?: string }) => {
  const classes = useStyles(styles);
  return <span className={classNames(className, classes.keyIcon)}>Q</span>;
};

// A bare tick approves only the current content; a circled one approves the user
const NOTE_ICON_RULES: [RegExp, IconComponent][] = [
  [/^approved current content only/i, CheckIcon],
  [/^approved/i, CheckCircleOutlineIcon],
  [/^snooze/i, AccessTimeIcon],
  [/\(content rejected\)/i, NotInterestedIcon],
  [/^removed from review queue/i, RemovedFromQueueIcon],
  [/reject|policy violation/i, NotInterestedIcon],
];

const ACTION_ICONS: Partial<Record<string, IconComponent>> = {
  [SNOOZE_EXPIRED]: AccessTimeIcon,
  [REJECTED_POST]: NotInterestedIcon,
  [REJECTED_COMMENT]: NotInterestedIcon,
  [AUTO_REMOVED_LLM_REJECTED_USER]: RemovedFromQueueIcon,
};

function getActionIcon(type: string) {
  return ACTION_ICONS[type] ?? FlagIcon;
}

function getNoteIcon(body: string) {
  const actionType = ACTION_TYPE_BY_QUOTED_LABEL.get(body.trim());
  if (actionType) return getActionIcon(actionType);
  return NOTE_ICON_RULES.find(([pattern]) => pattern.test(body))?.[1] ?? NotesIcon;
}

const NOISE_NOTE = /^removed from review queue without snooze\/approval$/i;
const NEUTRAL_NOTE = /^kept in review queue/i;
const APPROVAL_NOTE = /^(approved|snooze|unflag)|\benabled\b/i;
const RESTRICTIVE_NOTE = /\b(disabled|ban|purge|purged|restricted|rejected|flag|rate limit|policy violation)\b/i;

type Tone = 'restrictive' | 'approval' | null;

type ActivityItem =
  | { kind: 'note', key: string, date: Date | null, note: ModeratorNoteEntry }
  | { kind: 'moderatorAction', key: string, date: Date, action: ModeratorActionDisplay, author: string | null, detail: string | null }
  | { kind: 'rateLimit', key: string, date: Date, rateLimit: UserRateLimitDisplay }
  | { kind: 'conversation', key: string, date: Date | null, conversation: ConversationsList };

function getActionTone(type: string): Tone {
  if (RESTRICTIVE_ACTION_TYPES.has(type)) return 'restrictive';
  if (APPROVAL_ACTION_TYPES.has(type)) return 'approval';
  return null;
}

function getNoteTone(body: string): Tone {
  const actionType = ACTION_TYPE_BY_QUOTED_LABEL.get(body.trim());
  if (actionType) return getActionTone(actionType);
  if (NEUTRAL_NOTE.test(body)) return null;
  if (APPROVAL_NOTE.test(body)) return 'approval';
  if (RESTRICTIVE_NOTE.test(body)) return 'restrictive';
  return null;
}

function isNoiseNote(note: ModeratorNoteEntry) {
  const body = note.body.trim();
  const actionType = ACTION_TYPE_BY_QUOTED_LABEL.get(body);
  return (!!actionType && HIDDEN_ACTION_TYPES.has(actionType)) || NOISE_NOTE.test(body);
}

function isNoteNearDate(timestamp: string | null, noteDate: Date, date: Date) {
  const offset = date.getTime() - noteDate.getTime();
  return TIME_OF_DAY.test(timestamp ?? '')
    ? Math.abs(offset) <= NOTE_MATCH_WINDOW_MS
    : Math.abs(offset) < DATE_ONLY_NOTE_MATCH_WINDOW_MS;
}

function takeClosestNote(notes: ModeratorNoteEntry[], usedNotes: Set<ModeratorNoteEntry>, date: Date, matches: (note: ModeratorNoteEntry) => boolean) {
  let closest: { note: ModeratorNoteEntry, distance: number } | null = null;
  for (const note of notes) {
    if (!note.date || usedNotes.has(note) || !matches(note)) continue;
    const distance = Math.abs(note.date.getTime() - date.getTime());
    if (isNoteNearDate(note.timestamp, note.date, date) && (!closest || distance < closest.distance)) {
      closest = { note, distance };
    }
  }
  if (closest) usedNotes.add(closest.note);
  return closest?.note ?? null;
}

// Folds the notes written alongside each moderator action into the action's row
function mergeActionsWithNotes(actions: ModeratorActionDisplay[], notes: ModeratorNoteEntry[]) {
  const usedNotes = new Set<ModeratorNoteEntry>();
  const mergedActions = actions.map(action => {
    const date = new Date(action.createdAt);
    const quotedLabel = `"${MODERATOR_ACTION_TYPES[action.type]}"`;
    const labelNote = takeClosestNote(notes, usedNotes, date, note => note.body.trim() === quotedLabel);
    const detailNote = AUTOMOD_RATE_LIMIT_TYPES.has(action.type)
      ? takeClosestNote(notes, usedNotes, date, note => AUTOMOD_RATE_LIMIT_NOTE.test(note.body.trim()))
      : null;
    return {
      action,
      date,
      author: labelNote?.author ?? detailNote?.author ?? null,
      detail: detailNote?.body.trim().match(AUTOMOD_RATE_LIMIT_NOTE)?.[1] ?? null,
    };
  });
  return { mergedActions, remainingNotes: notes.filter(note => !usedNotes.has(note)) };
}

function getGroupKey(item: ActivityItem) {
  switch (item.kind) {
    case 'note':
      return `note:${item.note.author}:${item.note.body}`;
    case 'moderatorAction':
      return `action:${item.action.type}:${item.author}:${item.detail}:${item.action.active}`;
    default:
      return null;
  }
}

// Collapses runs of identical rows (eg automod re-triggering the same rate limit) into one row with a count
function collapseRepeats(items: ActivityItem[]) {
  const collapsed: { item: ActivityItem, count: number }[] = [];
  for (const item of items) {
    const previous = collapsed.at(-1);
    const groupKey = getGroupKey(item);
    if (previous && groupKey && groupKey === getGroupKey(previous.item)) {
      previous.count++;
    } else {
      collapsed.push({ item, count: 1 });
    }
  }
  return collapsed;
}

export function getActivityItems(user: Pick<SunshineUsersList, 'moderatorActions' | 'sunshineNotes' | 'userRateLimits'>, conversations: ConversationsList[], now: Date, filterNoise: boolean) {
  const actions = user.moderatorActions ?? [];
  const notes = parseModeratorNotes(user.sunshineNotes, now);
  const { mergedActions, remainingNotes } = mergeActionsWithNotes(
    filterNoise ? actions.filter(action => !HIDDEN_ACTION_TYPES.has(action.type)) : actions,
    filterNoise ? notes.filter(note => !isNoiseNote(note)) : notes,
  );
  // Actions have no conversation ID. Keep their own dates and authors instead of
  // inferring a relationship from an overlapping conversation's activity span.
  const items: ActivityItem[] = [
    ...remainingNotes.map((note, index): ActivityItem => ({ kind: 'note', key: `note-${index}`, date: note.date, note })),
    ...mergedActions.map(({ action, date, author, detail }): ActivityItem => ({ kind: 'moderatorAction', key: action._id, date, action, author, detail })),
    ...(user.userRateLimits ?? []).map((rateLimit): ActivityItem => ({ kind: 'rateLimit', key: rateLimit._id, date: new Date(rateLimit.createdAt), rateLimit })),
    ...conversations.map((conversation): ActivityItem => ({
      kind: 'conversation',
      key: conversation._id,
      date: conversation.latestActivity ? new Date(conversation.latestActivity) : null,
      conversation,
    })),
  ];
  // Undated items (mostly hand-written legacy notes) go last, in their original order
  return collapseRepeats(items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => (b.item.date?.getTime() ?? -Infinity) - (a.item.date?.getTime() ?? -Infinity) || a.index - b.index)
    .map(({ item }) => item));
}

function getPendingDescription(user: SunshineUsersList) {
  const postCount = user.pendingPostCount ?? 0;
  const commentCount = user.pendingCommentCount ?? 0;
  return [
    postCount > 0 && `${postCount} ${postCount === 1 ? 'post' : 'posts'}`,
    commentCount > 0 && `${commentCount} ${commentCount === 1 ? 'comment' : 'comments'}`,
  ].filter(Boolean).join(' and ');
}

function getEndDescription(endedAt: string | null, now: Date) {
  if (!endedAt) return null;
  const end = moment(endedAt);
  return end.isAfter(now) ? `ends ${end.from(now)}` : `ended ${end.from(now)}`;
}

const ActivityRow = ({ icon, date, author, tone, isHuman, count = 1, expansion, className, children }: {
  icon: React.ReactNode;
  date: React.ReactNode;
  author?: string | null;
  tone?: Tone;
  isHuman?: boolean;
  count?: number;
  // Spans the full row width, beneath it
  expansion?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) => {
  const classes = useStyles(styles);
  return <div className={classNames(classes.item, className, {
    [classes.humanRow]: isHuman,
    [classes.automated]: author === AUTOMOD_AUTHOR,
  })}>
    <div className={classes.meta}>
      <span className={classes.date}>{date}</span>
      {author && <span className={classes.author}>{author}</span>}
    </div>
    {icon}
    <div className={classNames(classes.body, tone && classes[tone], { [classes.human]: isHuman })}>
      {children}
      {count > 1 && <span className={classes.secondary}> ×{count}</span>}
    </div>
    {expansion}
  </div>;
};

const ConversationActivityRow = ({ user, conversation, date }: {
  user: SunshineUsersList;
  conversation: ConversationsList;
  date: React.ReactNode;
}) => {
  const classes = useStyles(styles);
  const [expanded, setExpanded] = useState(false);
  const moderators = conversation.participants?.filter(participant => participant._id !== user._id) ?? [];
  // A single-message conversation's latest message is also its first
  const hasEarlierMessages = conversation.messageCount > 1;
  const { data: firstMessageData } = useQuery(FirstMessageQuery, {
    variables: { selector: { messagesConversation: { conversationId: conversation._id } }, limit: 1 },
    skip: !hasEarlierMessages,
  });
  const firstMessage = hasEarlierMessages ? firstMessageData?.messages?.results?.[0] : conversation.latestMessage;
  const snippet = useMemo(
    () => htmlToTextDefault(firstMessage?.contents?.html ?? '').replace(/\s+/g, ' ').trim(),
    [firstMessage],
  );
  // Whoever opened the thread, falling back to the moderators in it
  const author = firstMessage?.user?.displayName
    ?? moderators.map(moderator => moderator.displayName).join(', ');
  return <ActivityRow
    icon={<EmailIcon className={classes.icon} />}
    date={date}
    author={author}
    isHuman
    expansion={expanded && <div className={classes.conversationPreview}>
      <ConversationPreview conversationId={conversation._id} showTitle={false} showFullWidth />
    </div>}
  >
    <LWTooltip
      As="div"
      inlineBlock={false}
      placement="left-start"
      tooltip={false}
      titleClassName={classes.conversationPreviewTooltip}
      title={<div><ConversationPreview conversationId={conversation._id} showTitle={false} showFullWidth /></div>}
    >
      <div className={classes.conversationHeader} onClick={() => setExpanded(!expanded)}>
        <span>
          Conversation with {moderators.map((participant, index) => <React.Fragment key={participant._id}>
            {index > 0 && ', '}
            <UsersName simple user={participant} />
          </React.Fragment>)}
          {conversation.messageCount > 1 && <span className={classes.secondary}> · {conversation.messageCount} messages</span>}
        </span>
        <Link to={`/inbox?isModInbox=true&conversation=${conversation._id}`} onClick={(e) => e.stopPropagation()}>
          <ForumIcon icon="Link" className={classes.conversationIcon} />
        </Link>
        <ForumIcon icon={expanded ? 'ExpandLess' : 'ExpandMore'} className={classes.conversationIcon} />
      </div>
    </LWTooltip>
    {!expanded && snippet && <div className={classes.messageSnippet}>{snippet}</div>}
  </ActivityRow>;
};

const ActivityItemRow = ({ user, item, count, now }: {
  user: SunshineUsersList;
  item: ActivityItem;
  count: number;
  now: Date;
}) => {
  const classes = useStyles(styles);
  const date = item.date && <FormatDate date={item.date} />;
  const isModeratorName = (author: string | null) => !!author && author !== AUTOMOD_AUTHOR && author !== user.displayName;

  switch (item.kind) {
    case 'note': {
      const NoteIcon = getNoteIcon(item.note.body);
      return <ActivityRow
        icon={<NoteIcon className={classes.icon} />}
        date={date ?? item.note.timestamp}
        author={item.note.author}
        tone={getNoteTone(item.note.body)}
        isHuman={isModeratorName(item.note.author)}
        count={count}
      >
        {item.note.body.replace(APPROVE_CURRENT_ONLY_EXPLANATION, '')}
      </ActivityRow>;
    }
    case 'moderatorAction': {
      const endDescription = getEndDescription(item.action.endedAt, now);
      const ActionIcon = getActionIcon(item.action.type);
      return <ActivityRow
        icon={<ActionIcon className={classes.icon} />}
        date={date}
        author={item.author}
        tone={getActionTone(item.action.type)}
        isHuman={item.author ? isModeratorName(item.author) : MODERATOR_ONLY_ACTION_TYPES.has(item.action.type)}
        count={count}
      >
        {MODERATOR_ACTION_TYPES[item.action.type] ?? item.action.type}
        {item.detail && `: ${item.detail}`}
        {endDescription && <span className={classNames(classes.secondary, classes.noWrap)}> · {endDescription}</span>}
      </ActivityRow>;
    }
    case 'rateLimit': {
      const endDescription = getEndDescription(item.rateLimit.endedAt, now) ?? getKarmaLiftDescription(item.rateLimit);
      return <ActivityRow
        icon={<TimerIcon className={classes.icon} />}
        date={date}
        tone="restrictive"
        isHuman
      >
        Rate limit: {getRateLimitDescription(item.rateLimit)}
        {endDescription && <span className={classNames(classes.secondary, classes.noWrap)}> · {endDescription}</span>}
      </ActivityRow>;
    }
    case 'conversation':
      return <ConversationActivityRow user={user} conversation={item.conversation} date={date} />;
  }
};

const ModerationActivityFeed = ({ user, currentUser, dispatch }: {
  user: SunshineUsersList;
  currentUser: UsersCurrent;
  dispatch: React.ActionDispatch<[action: InboxAction]>;
}) => {
  const classes = useStyles(styles);
  const now = useCurrentTime();

  const { data } = useQuery(ModeratorConversationsQuery, {
    variables: {
      selector: { moderatorConversations: { userId: user._id } },
      limit: 20,
    },
    fetchPolicy: 'cache-and-network',
  });
  const conversations = data?.conversations?.results;

  const { includeAllActivity, setIncludeAllActivity } = useLocalStorageState('includeAllActivity', key => `supermod_${key}`, 'false');
  const filterNoise = includeAllActivity !== 'true';

  const items = useMemo(
    () => getActivityItems(user, conversations ?? [], now, filterNoise),
    [user, conversations, now, filterNoise],
  );
  const pendingDescription = getPendingDescription(user);

  return (
    <div className={classes.root}>
      <div className={classes.titleRow}>
        <ModerationSectionTitle>Moderator Activity</ModerationSectionTitle>
        <label className={classes.noiseFilter}>
          <input
            type="checkbox"
            checked={!filterNoise}
            onChange={(e) => setIncludeAllActivity(e.target.checked ? 'true' : 'false')}
          />
          <span>Include all</span>
        </label>
      </div>
      <ModeratorNoteComposer user={user} currentUser={currentUser} dispatch={dispatch} />
      <div>
        {pendingDescription && <ActivityRow
          icon={<VisibilityIcon className={classes.icon} />}
          date={null}
          className={classes.pendingRow}
        >
          {pendingDescription} awaiting review
        </ActivityRow>}
        {items.map(({ item, count }) => <ActivityItemRow key={item.key} user={user} item={item} count={count} now={now} />)}
      </div>
    </div>
  );
};

export default ModerationActivityFeed;
