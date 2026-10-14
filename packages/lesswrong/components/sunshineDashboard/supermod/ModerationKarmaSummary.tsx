import React from 'react';
import moment from 'moment';
import classNames from 'classnames';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { useCurrentTime } from '@/lib/utils/timeUtil';
import DescriptionIcon from '@/lib/vendor/@material-ui/icons/src/Description';
import MessageIcon from '@/lib/vendor/@material-ui/icons/src/Message';
import LLMScoreBadge from './LLMScoreBadge';
import PostKarmaWithPreview from '../PostKarmaWithPreview';
import CommentKarmaWithPreview from '../CommentKarmaWithPreview';
import { getAverageContentKarma } from '@/lib/collections/moderatorActions/helpers';
import LWTooltip from '@/components/common/LWTooltip';
import FormatDate from '@/components/common/FormatDate';
import ForumIcon from '@/components/common/ForumIcon';
import { downvoteRatioTooltip, downvoterTooltip, recentKarmaTooltip } from '../ModeratorUserInfo/UserAutoRateLimitsDisplay';
import { getDownvoteRatio } from '@/lib/rateLimits/utils';
import { ModerationUserContactCounts, ModerationUserVotesCast } from './ModerationUserVoteStats';
import { CONTENT_PERIODS, getContentPeriodIndex, isAwaitingReview, isMapPin, isPost, POSITIVE_KARMA, type ContentItem, type ModerationContentItem } from './helpers';

const styles = defineStyles('ModerationKarmaSummary', (theme: ThemeType) => ({
  statsCard: {
    ...theme.typography.commentStyle,
    backgroundColor: theme.palette.greyAlpha(0.03),
    borderRadius: 4,
    padding: '10px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    fontSize: 13,
  },
  header: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  totalKarmaRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 6,
  },
  totalKarma: {
    fontSize: 22,
    fontWeight: 600,
    lineHeight: 1,
    color: theme.palette.grey[800],
  },
  totalKarmaLabel: {
    fontSize: 11,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    color: theme.palette.grey[500],
  },
  accountAge: {
    marginLeft: 10,
    fontSize: 15,
    fontWeight: 600,
    color: theme.palette.grey[700],
  },
  karmaStats: {
    display: 'flex',
    flexWrap: 'wrap',
    columnGap: 14,
    rowGap: 2,
  },
  karmaStat: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 4,
    fontSize: 12,
  },
  karmaStatValue: {
    fontWeight: 500,
  },
  karmaStatLabel: {
    color: theme.palette.grey[600],
  },
  typeHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 12,
  },
  typeCount: {
    fontWeight: 500,
  },
  typeDetail: {
    fontSize: 11,
    color: theme.palette.grey[500],
  },
  typeIcon: {
    height: 13,
    width: 13,
    color: theme.palette.grey[500],
  },
  strip: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    columnGap: 2,
    rowGap: 2,
    marginTop: 3,
  },
  periodLabel: {
    fontSize: 11,
    color: theme.palette.grey[500],
    marginRight: 2,
  },
  periodDivider: {
    alignSelf: 'stretch',
    width: 1,
    margin: '0 6px',
    backgroundColor: theme.palette.greyAlpha(0.15),
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  karma: {
    fontWeight: 600,
    padding: '0 3px',
    borderRadius: 3,
    color: theme.palette.grey[600],
  },
  postKarma: {
    fontFamily: theme.palette.fonts.serifStack,
  },
  positive: {
    color: theme.palette.primary.main,
  },
  negative: {
    color: theme.palette.error.main,
  },
  rejectedIcon: {
    width: 14,
    height: 14,
    color: theme.palette.error.main,
    position: 'relative',
    top: 2,
  },
  awaiting: {
    boxShadow: `inset 0 0 0 1.5px ${theme.palette.primary.dark}`,
  },
  llmScoreCorner: {
    ...theme.typography.commentStyle,
    position: 'absolute',
    top: 10,
    right: 12,
    zIndex: 1,
  },

}));

const Karma = ({ item }: { item: ContentItem }) => {
  const classes = useStyles(styles);
  const karma = item.baseScore ?? 0;
  if (item.rejected) {
    return <span className={classes.karma}>
      <ForumIcon icon="Close" className={classes.rejectedIcon} />
    </span>;
  }
  return <span className={classNames(classes.karma, {
    [classes.postKarma]: isPost(item),
    [classes.positive]: karma >= POSITIVE_KARMA,
    [classes.negative]: karma < 0,
    [classes.awaiting]: isAwaitingReview(item),
  })}>
    {karma}
  </span>;
};

const LlmScoreCorner = ({ item }: { item: ContentItem }) => {
  const classes = useStyles(styles);
  return <div className={classes.llmScoreCorner}>
    <LLMScoreBadge
      documentId={item._id}
      automatedContentEvaluations={item.automatedContentEvaluations}
      contentHtml={item.contents?.html ?? ''}
      contentType={isPost(item) ? 'Post' : 'Comment'}
      showWhenEmpty
    />
  </div>;
};

function formatSigned(value: number) {
  return value > 0 ? `+${value}` : value < 0 ? `−${-value}` : '0';
}

const KarmaStat = ({ value, label, tooltip, signed }: {
  value?: React.ReactNode;
  label: string;
  tooltip: React.ReactNode;
  signed?: number;
}) => {
  const classes = useStyles(styles);
  return <LWTooltip title={tooltip}>
    <div className={classes.karmaStat}>
      <span className={classNames(classes.karmaStatValue, signed !== undefined && {
        [classes.positive]: signed > 0,
        [classes.negative]: signed < 0,
      })}>{signed !== undefined ? formatSigned(signed) : value}</span>
      <span className={classes.karmaStatLabel}>{label}</span>
    </div>
  </LWTooltip>;
};

const ContentTypeStrip = ({ icon, noun, items, hiddenCount, now }: {
  icon: React.ReactNode;
  noun: string;
  items: ContentItem[];
  hiddenCount: number;
  now: moment.Moment;
}) => {
  const classes = useStyles(styles);
  const periods = CONTENT_PERIODS
    .map((period, periodIndex) => ({
      ...period,
      items: items.filter(item => getContentPeriodIndex(item.postedAt, now) === periodIndex),
    }))
    .filter(period => period.items.length > 0);

  return <div>
    <div className={classes.typeHeader}>
      {icon}
      <span className={classes.typeCount}>{items.length} {items.length === 1 ? noun : `${noun}s`}</span>
      <span className={classes.typeDetail}>
        avg {getAverageContentKarma(items).toFixed(1)}
        {hiddenCount > 0 && ` · ${hiddenCount} drafted/rejected`}
      </span>
    </div>
    <div className={classes.strip}>
      {periods.map((period, index) => <React.Fragment key={period.label}>
        {index > 0 && <span className={classes.periodDivider} />}
        <span className={classes.periodLabel}>{period.shortLabel}</span>
        {period.items.map(item => isPost(item)
          ? <PostKarmaWithPreview key={item._id} post={item} previewOverlay={<LlmScoreCorner item={item} />}><Karma item={item} /></PostKarmaWithPreview>
          : <CommentKarmaWithPreview key={item._id} comment={item} previewOverlay={<LlmScoreCorner item={item} />}><Karma item={item} /></CommentKarmaWithPreview>)}
      </React.Fragment>)}
    </div>
  </div>;
};

const ModerationKarmaSummary = ({ user, items }: {
  user: SunshineUsersList;
  items: ModerationContentItem[];
}) => {
  const classes = useStyles(styles);
  const now = moment(useCurrentTime());
  const { last20Karma = 0, lastMonthKarma = 0, downvoterCount = 0 } = user.recentKarmaInfo ?? {};

  const content = items
    .flatMap(item => isMapPin(item) ? [] : [item])
    .sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime());
  const posts = content.filter(isPost);
  const comments = content.filter(item => !isPost(item));

  return (
    <div className={classes.statsCard}>
      <div className={classes.header}>
        <div className={classes.totalKarmaRow}>
          <span className={classNames(classes.totalKarma, { [classes.negative]: (user.karma ?? 0) < 0 })}>{user.karma ?? 0}</span>
          <span className={classes.totalKarmaLabel}>Karma</span>
          <span className={classes.accountAge}><FormatDate date={user.createdAt} /></span>
          <span className={classes.totalKarmaLabel}>Old</span>
        </div>
        <div className={classes.headerRight}>
          <ModerationUserContactCounts user={user} />
          <ModerationUserVotesCast user={user} />
        </div>
      </div>
      <div className={classes.karmaStats}>
        <KarmaStat signed={last20Karma} label="last 20" tooltip={recentKarmaTooltip(user)} />
        <KarmaStat signed={lastMonthKarma} label="last month" tooltip={recentKarmaTooltip(user)} />
        <KarmaStat value={downvoterCount} label="downvoters" tooltip={downvoterTooltip(user)} />
        <KarmaStat value={`${Math.round(getDownvoteRatio(user) * 100)}%`} label="downvoted" tooltip={downvoteRatioTooltip(user)} />
      </div>
      {posts.length > 0 && <ContentTypeStrip
        icon={<DescriptionIcon className={classes.typeIcon} />}
        noun="post"
        items={posts}
        hiddenCount={(user.maxPostCount ?? 0) - (user.postCount ?? 0)}
        now={now}
      />}
      {comments.length > 0 && <ContentTypeStrip
        icon={<MessageIcon className={classes.typeIcon} />}
        noun="comment"
        items={comments}
        hiddenCount={(user.maxCommentCount ?? 0) - (user.commentCount ?? 0)}
        now={now}
      />}
    </div>
  );
};

export default ModerationKarmaSummary;
