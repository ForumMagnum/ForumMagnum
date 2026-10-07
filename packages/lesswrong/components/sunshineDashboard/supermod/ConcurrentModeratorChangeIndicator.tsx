import React from 'react';
import classNames from 'classnames';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import ForumIcon from '@/components/common/ForumIcon';
import FormatDate from '@/components/common/FormatDate';
import LWTooltip from '@/components/common/LWTooltip';
import { useConcurrentModeratorChangesFor, type ConcurrentModeratorChange } from './useConcurrentModeratorChanges';

const styles = defineStyles('ConcurrentModeratorChangeIndicator', (theme: ThemeType) => ({
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 11,
    fontWeight: 600,
    padding: '2px 6px',
    borderRadius: 3,
    marginRight: 8,
    flexShrink: 0,
    whiteSpace: 'nowrap',
    color: theme.palette.text.warning,
    backgroundColor: theme.palette.background.warningTranslucent,
  },
  banner: {
    ...theme.typography.commentStyle,
    display: 'flex',
    gap: 8,
    fontSize: 13,
    lineHeight: '18px',
    padding: '10px 12px',
    color: theme.palette.text.warning,
    backgroundColor: theme.palette.background.warningTranslucent,
  },
  icon: {
    fontSize: 14,
    flexShrink: 0,
  },
  bannerIcon: {
    marginTop: 2,
  },
  fieldNames: {
    fontWeight: 400,
  },
}));

const ChangeDescriptions = ({ changes }: { changes: ConcurrentModeratorChange[] }) => {
  const classes = useStyles(styles);
  return <>
    {changes.map(change => (
      <div key={change.moderatorName}>
        {change.moderatorName} changed <span className={classes.fieldNames}>{change.fieldNames.join(', ')}</span>{' '}
        <FormatDate date={change.lastChangedAt} tooltip={false} includeAgo />
      </div>
    ))}
    <div>Reload to see their changes.</div>
  </>;
};

/** Flags users/posts that another moderator has changed since this inbox loaded */
const ConcurrentModeratorChangeIndicator = ({ documentId, variant }: {
  documentId: string;
  variant: 'badge' | 'banner';
}) => {
  const classes = useStyles(styles);
  const changes = useConcurrentModeratorChangesFor(documentId);
  if (changes.length === 0) return null;

  if (variant === 'banner') {
    return (
      <div className={classes.banner}>
        <ForumIcon icon="Warning" className={classNames(classes.icon, classes.bannerIcon)} />
        <div><ChangeDescriptions changes={changes} /></div>
      </div>
    );
  }

  return (
    <LWTooltip title={<ChangeDescriptions changes={changes} />}>
      <span className={classes.badge}>
        <ForumIcon icon="Warning" className={classes.icon} />
        {changes.map(change => change.moderatorName).join(', ')}
      </span>
    </LWTooltip>
  );
};

export default ConcurrentModeratorChangeIndicator;
