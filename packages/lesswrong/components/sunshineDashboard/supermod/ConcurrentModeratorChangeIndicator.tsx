import React from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import ForumIcon from '@/components/common/ForumIcon';
import FormatDate from '@/components/common/FormatDate';
import LWTooltip from '@/components/common/LWTooltip';
import Button from '@/lib/vendor/@material-ui/core/src/Button';
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
    cursor: 'pointer',
    color: theme.palette.text.warning,
    backgroundColor: theme.palette.background.warningTranslucent,
  },
  banner: {
    ...theme.typography.commentStyle,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 13,
    lineHeight: '18px',
    padding: '8px 12px',
    color: theme.palette.text.warning,
    backgroundColor: theme.palette.background.warningTranslucent,
  },
  bannerMessage: {
    flex: 1,
  },
  icon: {
    fontSize: 14,
    flexShrink: 0,
  },
  reloadButton: {
    fontSize: 12,
    padding: '2px 10px',
    minWidth: 'auto',
    flexShrink: 0,
    color: theme.palette.text.warning,
  },
}));

const ChangeDescriptions = ({ changes }: { changes: ConcurrentModeratorChange[] }) => <>
  {changes.map(change => (
    <div key={change.moderatorName}>
      {change.moderatorName} changed this record <FormatDate date={change.lastChangedAt} tooltip={false} includeAgo />
    </div>
  ))}
</>;

function reloadPage(event: React.MouseEvent) {
  // The badge sits inside list rows, whose own click handlers open the record
  event.stopPropagation();
  window.location.reload();
}

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
        <ForumIcon icon="Warning" className={classes.icon} />
        <div className={classes.bannerMessage}><ChangeDescriptions changes={changes} /></div>
        <Button className={classes.reloadButton} variant="outlined" onClick={reloadPage}>
          Reload
        </Button>
      </div>
    );
  }

  return (
    <LWTooltip title={<><ChangeDescriptions changes={changes} /><div>Click to reload.</div></>}>
      <span className={classes.badge} onClick={reloadPage}>
        <ForumIcon icon="Warning" className={classes.icon} />
        {changes.map(change => change.moderatorName).join(', ')}
      </span>
    </LWTooltip>
  );
};

export default ConcurrentModeratorChangeIndicator;
