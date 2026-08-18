import React from 'react';
import classNames from 'classnames';
import ForumIcon from '@/components/common/ForumIcon';
import ContentStyles from '@/components/common/ContentStyles';
import FormatDate from '@/components/common/FormatDate';
import { ContentItemBody } from '@/components/contents/ContentItemBody';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { htmlToTextDefault } from '@/lib/htmlToText';
import { truncate } from '@/lib/editor/ellipsize';
import type { MapPinContentItem } from './helpers';

const listItemStyles = defineStyles('ModerationMapPinListItem', (theme: ThemeType) => ({
  root: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 20px',
    borderBottom: theme.palette.border.faint,
    cursor: 'pointer',
    transition: 'background-color 0.1s ease',
    '&:hover': {
      backgroundColor: theme.palette.grey[50],
    },
    ...theme.typography.commentStyle,
    overflow: 'hidden',
    minWidth: 0,
  },
  focused: {
    borderLeft: `3px solid ${theme.palette.primary.main}`,
    paddingLeft: 17,
    backgroundColor: theme.palette.grey[100],
  },
  icon: {
    height: 14,
    width: 14,
    color: theme.palette.grey[500],
    flexShrink: 0,
    marginRight: 12,
  },
  postedAt: {
    fontSize: 13,
    color: theme.palette.grey[600],
    marginRight: 8,
    minWidth: 24,
    flexShrink: 0,
  },
  preview: {
    flex: 1,
    minWidth: 100,
    overflow: 'hidden',
  },
  title: {
    fontSize: 14,
    fontWeight: 500,
    color: theme.palette.grey[900],
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    marginBottom: 2,
  },
  text: {
    fontSize: 13,
    color: theme.palette.grey[600],
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  status: {
    fontSize: 11,
    padding: '2px 6px',
    borderRadius: 3,
    marginLeft: 8,
    textTransform: 'uppercase',
    fontWeight: 600,
    flexShrink: 0,
    whiteSpace: 'nowrap',
    backgroundColor: theme.palette.grey[200],
    color: theme.palette.grey[700],
  },
}));

const detailStyles = defineStyles('ModerationMapPinDetail', (theme: ThemeType) => ({
  root: {
    padding: 24,
    ...theme.typography.commentStyle,
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 24,
  },
  titleIcon: {
    width: 24,
    height: 24,
    color: theme.palette.grey[600],
  },
  title: {
    ...theme.typography.headerStyle,
    fontSize: 28,
  },
  metadata: {
    display: 'grid',
    gap: 16,
    paddingBottom: 24,
    marginBottom: 24,
    borderBottom: theme.palette.border.normal,
  },
  label: {
    color: theme.palette.grey[600],
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  value: {
    color: theme.palette.grey[900],
    fontSize: 15,
  },
  description: {
    fontSize: 15,
  },
  rawDescription: {
    whiteSpace: 'pre-wrap',
  },
  emptyDescription: {
    color: theme.palette.grey[600],
    fontStyle: 'italic',
  },
}));

function getMapPinPreview(item: MapPinContentItem): string {
  const description = item.htmlMapMarkerText
    ? htmlToTextDefault(item.htmlMapMarkerText)
    : item.mapMarkerText;
  return truncate(
    [item.formattedAddress, description].filter(Boolean).join(' — ') || 'No location or description provided',
    100,
    'characters',
  );
}

export const ModerationMapPinListItem = ({ item, isFocused, onOpen }: {
  item: MapPinContentItem;
  isFocused: boolean;
  onOpen: () => void;
}) => {
  const classes = useStyles(listItemStyles);

  return <div className={classNames(classes.root, { [classes.focused]: isFocused })} onClick={onOpen}>
    <ForumIcon icon="MapPin" className={classes.icon} />
    <div className={classes.postedAt}><FormatDate date={item.postedAt} /></div>
    <div className={classes.preview}>
      <div className={classes.title}>Unreviewed map pin</div>
      <div className={classes.text}>{getMapPinPreview(item)}</div>
    </div>
    <div className={classes.status}>Unreviewed</div>
  </div>;
};

export const ModerationMapPinDetail = ({ item }: { item: MapPinContentItem }) => {
  const classes = useStyles(detailStyles);
  const coordinates = item.latitude !== null && item.longitude !== null
    ? `${item.latitude}, ${item.longitude}`
    : null;

  return <div className={classes.root}>
    <div className={classes.titleRow}>
      <ForumIcon icon="MapPin" className={classes.titleIcon} />
      <div className={classes.title}>Unreviewed map pin</div>
    </div>
    <div className={classes.metadata}>
      <div>
        <div className={classes.label}>Location</div>
        <div className={classes.value}>{item.formattedAddress ?? 'No formatted address provided'}</div>
      </div>
      {coordinates && <div>
        <div className={classes.label}>Coordinates</div>
        <div className={classes.value}>{coordinates}</div>
      </div>}
      <div>
        <div className={classes.label}>Submitted</div>
        <div className={classes.value}><FormatDate date={item.postedAt} /></div>
      </div>
    </div>
    <div className={classes.label}>Public marker description</div>
    {item.htmlMapMarkerText
      ? <ContentStyles contentType="comment" className={classes.description}>
        <ContentItemBody dangerouslySetInnerHTML={{ __html: item.htmlMapMarkerText }} />
      </ContentStyles>
      : item.mapMarkerText
        ? <div className={classNames(classes.description, classes.rawDescription)}>{item.mapMarkerText}</div>
        : <div className={classes.emptyDescription}>No marker description provided</div>}
  </div>;
};
