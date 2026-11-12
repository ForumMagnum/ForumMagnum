import React from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import ForumIcon from '@/components/common/ForumIcon';
import LWTooltip from '@/components/common/LWTooltip';
import WarningBanner from '@/components/common/WarningBanner';
import Button from '@/lib/vendor/@material-ui/core/src/Button';
import { useCurrentTime } from '@/lib/utils/timeUtil';
import { formatRelative } from '@/lib/utils/timeFormat';
import { escapeHtml } from '@/lib/utils/sanitize';
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
  icon: {
    fontSize: 14,
    flexShrink: 0,
  },
  reloadButton: {
    fontSize: 12,
    padding: '2px 10px',
    minWidth: 'auto',
    color: theme.palette.text.warning,
  },
}));

function describeChanges(changes: ConcurrentModeratorChange[], now: Date): string[] {
  return changes.map(change => `${change.moderatorName} changed this record ${formatRelative(change.lastChangedAt, now, true)}`);
}

const ConcurrentModeratorChangeIndicator = ({ documentId, variant }: {
  documentId: string;
  variant: 'badge' | 'banner';
}) => {
  const classes = useStyles(styles);
  const now = useCurrentTime();
  const changes = useConcurrentModeratorChangesFor(documentId);
  if (changes.length === 0) return null;
  const descriptions = describeChanges(changes, now);

  if (variant === 'banner') {
    return (
      <WarningBanner
        message={descriptions.map(escapeHtml).join('<br/>')}
        action={
          <Button className={classes.reloadButton} variant="outlined" onClick={() => window.location.reload()}>
            Reload
          </Button>
        }
      />
    );
  }

  return (
    <LWTooltip title={descriptions.map(description => <div key={description}>{description}</div>)}>
      <span className={classes.badge}>
        <ForumIcon icon="Warning" className={classes.icon} />
        {changes.map(change => change.moderatorName).join(', ')}
      </span>
    </LWTooltip>
  );
};

export default ConcurrentModeratorChangeIndicator;
