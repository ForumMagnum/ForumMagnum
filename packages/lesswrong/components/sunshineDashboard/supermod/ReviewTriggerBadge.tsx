import React from 'react';
import { useStyles, defineStyles } from '@/components/hooks/useStyles';
import classNames from 'classnames';

const styles = defineStyles("ReviewTriggerBadge", (theme: ThemeType) => ({ 
  badge: {
    fontSize: 11,
    padding: '2px 6px',
    borderRadius: 3,
    backgroundColor: theme.palette.grey[200],
    color: theme.palette.grey[700],
    marginRight: 8,
    textTransform: 'uppercase',
    fontWeight: 600,
    flexShrink: 0,
    whiteSpace: 'nowrap',
  },
  lowEmphasis: {
    opacity: 0.5,
  },
}));

const ReviewTriggerBadge = ({ badge, stale, fallback }: {
  badge: React.ReactNode,
  stale?: boolean,
  fallback?: boolean
}) => {
  const classes = useStyles(styles);

  return (
    <div className={classNames(
      classes.badge,
      (stale || fallback) && classes.lowEmphasis,
    )}>
      {badge}
      {fallback && ' (fallback)'}
    </div>
  )
}

export default ReviewTriggerBadge;
