import React, { useEffect, useRef, useState } from 'react';
import FullscreenExitIcon from '@/lib/vendor/@material-ui/icons/src/FullscreenExit';
import moment from 'moment';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { useQuery } from '@/lib/crud/useQuery';
import { gql } from '@/lib/generated/gql-codegen';
import { MODERATED_USER_CONTENT_LIMIT } from '@/components/hooks/useModeratedUserContents';
import { useCurrentTime } from '@/lib/utils/timeUtil';
import type { InboxAction } from './inboxReducer';
import { CONTENT_PERIODS, getContentPeriodIndex, isMapPin, isPost, needsDecision, type ModerationContentItem } from './helpers';
import { ModerationMapPinDetail, ModerationMapPinListItem } from './ModerationMapPin';
import ModerationFeedCard from './ModerationFeedCard';
import ModerationContentDetail from './ModerationContentDetail';

const EARLIER_INITIAL_WORDS = 20;
// Pending content is what's being judged, so it starts longer than the usual card
const DECISION_INITIAL_WORDS = 300;

// A lone pending item is the whole decision, so it's shown in full
function getDecisionInitialWords(decisionCount: number) {
  return decisionCount === 1 ? Infinity : DECISION_INITIAL_WORDS;
}

const styles = defineStyles('ModerationUserFeed', (theme: ThemeType) => ({
  root: {
    backgroundColor: theme.palette.background.paper,
    minHeight: '100%',
    padding: '16px 24px 48px',
  },
  column: {
    maxWidth: 760,
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  sectionTitle: {
    ...theme.typography.commentStyle,
    marginTop: 8,
    fontSize: 15,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: theme.palette.grey[600],
  },
  entry: {
    borderRadius: 4,
    scrollMarginTop: 16,
  },
  fullscreenRoot: {
    backgroundColor: theme.palette.background.paper,
    minHeight: '100%',
  },
  // Matches the post page's reading width
  fullscreenBody: {
    maxWidth: 765,
    margin: '0 auto',
  },
  fullscreenHeader: {
    ...theme.typography.commentStyle,
    position: 'sticky',
    top: 0,
    zIndex: 1,
    display: 'flex',
    justifyContent: 'flex-end',
    padding: '8px 16px',
    backgroundColor: theme.palette.background.paper,
    borderBottom: theme.palette.border.faint,
  },
  backToFeedButton: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 13,
    color: theme.palette.grey[600],
    cursor: 'pointer',
    '&:hover': {
      color: theme.palette.grey[900],
    },
  },
  exitIcon: {
    height: 18,
    width: 18,
  },
}));

const CoauthoredPostsQuery = gql(`
  query multiPostModerationUserFeedCoauthoredQuery($selector: PostSelector, $limit: Int) {
    posts(selector: $selector, limit: $limit) {
      results {
        ...SunshinePostsList
      }
    }
  }
`);

interface IndexedItem {
  item: ModerationContentItem;
  index: number;
}

interface FullscreenSelection {
  postId: string;
  focusedItemId: string | null;
}

type PeriodEntry =
  | { kind: 'own', entry: IndexedItem }
  | { kind: 'coauthored', post: SunshinePostsList };

interface FeedEntryProps {
  entry: IndexedItem;
  initialWordCount?: number;
  showParentDefault?: boolean;
  focusedItemId: string | null;
  runningLlmCheckId: string | null;
  onFullscreen: (postId: string) => void;
  dispatch: React.ActionDispatch<[action: InboxAction]>;
}

function getPeriodEntryDate(periodEntry: PeriodEntry) {
  return periodEntry.kind === 'own' ? periodEntry.entry.item.postedAt : periodEntry.post.postedAt;
}

function getItemsByPeriod(items: IndexedItem[], coauthoredPosts: SunshinePostsList[], now: Date) {
  const nowMoment = moment(now);
  const periodEntries: PeriodEntry[] = [
    ...items.map((entry): PeriodEntry => ({ kind: 'own', entry })),
    ...coauthoredPosts.map((post): PeriodEntry => ({ kind: 'coauthored', post })),
  ].sort((a, b) => new Date(getPeriodEntryDate(b)).getTime() - new Date(getPeriodEntryDate(a)).getTime());
  return CONTENT_PERIODS.map((period, periodIndex) => ({
    ...period,
    periodIndex,
    entries: periodEntries.filter(periodEntry => getContentPeriodIndex(getPeriodEntryDate(periodEntry), nowMoment) === periodIndex),
  }));
}

const FeedCard = ({ entry: { item, index }, initialWordCount, showParentDefault, focusedItemId, runningLlmCheckId, onFullscreen, dispatch }: FeedEntryProps) => {
  const classes = useStyles(styles);
  const ref = useRef<HTMLDivElement>(null);
  const isFocused = item._id === focusedItemId;

  useEffect(() => {
    if (isFocused) ref.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [isFocused]);

  const open = () => {
    if (!isFocused) dispatch({ type: 'OPEN_CONTENT', contentIndex: index });
  };

  if (isMapPin(item)) {
    return <div ref={ref} className={classes.entry}>
      {isFocused
        ? <ModerationMapPinDetail item={item} />
        : <ModerationMapPinListItem item={item} isFocused={false} onOpen={open} />}
    </div>;
  }

  return (
    <div ref={ref} className={classes.entry} onClickCapture={open}>
      <ModerationFeedCard
        item={item}
        isSelected={isFocused}
        initialWordCount={initialWordCount}
        showParentDefault={showParentDefault}
        isRunningLlmCheck={item._id === runningLlmCheckId}
        onReject={() => dispatch({ type: 'OPEN_CONTENT', contentIndex: index, sidebarTab: 'reject' })}
        onFullscreen={isPost(item) ? () => onFullscreen(item._id) : undefined}
        dispatch={dispatch}
      />
    </div>
  );
};

const ModerationUserFeed = ({ user, items, focusedItemId, runningLlmCheckId, dispatch }: {
  user: Pick<SunshineUsersList, '_id'>;
  items: ModerationContentItem[];
  focusedItemId: string | null;
  runningLlmCheckId: string | null;
  dispatch: React.ActionDispatch<[action: InboxAction]>;
}) => {
  const classes = useStyles(styles);
  const currentTime = useCurrentTime();

  const { data: postsData } = useQuery(CoauthoredPostsQuery, {
    variables: { selector: { coauthoredPosts: { userId: user._id } }, limit: MODERATED_USER_CONTENT_LIMIT },
    ssr: false,
  });
  // Kept out of `items`, which the stats card and keyboard navigation work from
  const coauthoredPosts = postsData?.posts?.results ?? [];

  const [fullscreen, setFullscreen] = useState<FullscreenSelection | null>(null);
  const fullscreenPostId = fullscreen?.postId;
  const fullscreenRef = useRef<HTMLDivElement>(null);
  const fullscreenPost = [...items, ...coauthoredPosts].find(item => item._id === fullscreenPostId);

  const openFullscreen = (postId: string) => {
    // Own cards also select their item in the click's capture phase.
    setFullscreen({ postId, focusedItemId: items.some(item => item._id === postId) ? postId : focusedItemId });
  };

  // Keyboard navigation to another item leaves fullscreen, back to the feed at that item
  useEffect(() => {
    if (fullscreen && focusedItemId !== fullscreen.focusedItemId) {
      setFullscreen(null);
    }
  }, [fullscreen, focusedItemId]);

  useEffect(() => {
    if (fullscreenPostId) fullscreenRef.current?.scrollIntoView({ block: 'start' });
  }, [fullscreenPostId]);

  if (fullscreenPost) {
    return (
      <div ref={fullscreenRef} className={classes.fullscreenRoot}>
        <div className={classes.fullscreenHeader}>
          <span className={classes.backToFeedButton} onClick={() => setFullscreen(null)}>
            <FullscreenExitIcon className={classes.exitIcon} />
            Back to feed
          </span>
        </div>
        <div className={classes.fullscreenBody}>
          <ModerationContentDetail item={fullscreenPost} />
        </div>
      </div>
    );
  }

  const indexed = items.map((item, index) => ({ item, index }));
  const decisions = indexed.filter(({ item }) => needsDecision(item));
  const periods = getItemsByPeriod(indexed.filter(({ item }) => !needsDecision(item)), coauthoredPosts, currentTime);

  const entryProps = { focusedItemId, runningLlmCheckId, onFullscreen: openFullscreen, dispatch };

  return (
    <div className={classes.root}>
      <div className={classes.column}>
        {decisions.length > 0 && <div className={classes.section}>
          <div className={classes.sectionTitle}>Needs decision · {decisions.length}</div>
          {decisions.map(entry => <FeedCard key={entry.item._id} entry={entry} initialWordCount={getDecisionInitialWords(decisions.length)} showParentDefault {...entryProps} />)}
        </div>}
        {periods.map(({ label, periodIndex, entries }) => entries.length > 0 && <div key={label} className={classes.section}>
          <div className={classes.sectionTitle}>{label}</div>
          {entries.map(periodEntry => periodEntry.kind === 'own'
            ? <FeedCard
              key={periodEntry.entry.item._id}
              entry={periodEntry.entry}
              initialWordCount={periodIndex > 0 ? EARLIER_INITIAL_WORDS : undefined}
              {...entryProps}
            />
            : <div key={periodEntry.post._id} className={classes.entry}>
              <ModerationFeedCard
                item={periodEntry.post}
                isSelected={false}
                isCoauthored
                initialWordCount={periodIndex > 0 ? EARLIER_INITIAL_WORDS : undefined}
                isRunningLlmCheck={false}
                onFullscreen={() => openFullscreen(periodEntry.post._id)}
                dispatch={dispatch}
              />
            </div>)}
        </div>)}
      </div>
    </div>
  );
};

export default ModerationUserFeed;
