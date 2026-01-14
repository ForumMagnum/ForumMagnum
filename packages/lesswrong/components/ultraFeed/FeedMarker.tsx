import React, { useMemo } from 'react';
import moment from 'moment';
import { defineStyles, useStyles } from '../hooks/useStyles';
import LWTooltip from '../common/LWTooltip';
import { ExpandedDate } from '../common/FormatDate';

const styles = defineStyles('FeedMarker', (theme: ThemeType) => ({
  root: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 12,
  },
  label: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 14,
    fontWeight: 500,
    color: theme.palette.grey[600],
    textTransform: 'none',
    letterSpacing: 0,
  },
}));

interface FeedMarkerProps {
  timestamp: string;
  markerType?: string | null;
}

const FeedMarker = ({ timestamp, markerType }: FeedMarkerProps) => {
  const classes = useStyles(styles);
  const formattedLabel = useMemo(() => {
    const m = moment(timestamp);
    if (markerType === 'day') {
      return m.format('dddd, MMMM D, h:mm A');
    }
    return m.format('h:mm A');
  }, [timestamp, markerType]);

  return (
    <div className={classes.root}>
      <LWTooltip title={<ExpandedDate date={timestamp} />}>
        <div className={classes.label}>{formattedLabel}</div>
      </LWTooltip>
    </div>
  );
};

export default FeedMarker;
