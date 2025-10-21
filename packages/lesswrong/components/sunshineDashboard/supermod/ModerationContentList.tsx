import React from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import ModerationContentItem from './ModerationContentItem';

const styles = defineStyles('ModerationContentList', (theme: ThemeType) => ({
  root: {
    backgroundColor: theme.palette.background.paper,
    borderRight: theme.palette.border.normal,
    overflowY: 'auto',
    height: 'fit-content',
  },
  header: {
    padding: '12px 20px',
    borderBottom: theme.palette.border.normal,
    position: 'sticky',
    top: 0,
    backgroundColor: theme.palette.background.paper,
    zIndex: 1,
  },
  title: {
    ...theme.typography.commentStyle,
    fontSize: 14,
    fontWeight: 600,
    textTransform: 'uppercase',
    color: theme.palette.grey[600],
    letterSpacing: '0.5px',
  },
  count: {
    fontSize: 13,
    color: theme.palette.grey[600],
    marginLeft: 4,
  },
  list: {
    // No padding - items will have their own spacing
  },
  empty: {
    padding: 40,
    textAlign: 'center',
    color: theme.palette.grey[600],
    fontSize: 14,
  },
}));

type ContentItem = SunshinePostsList | CommentsListWithParentMetadata;

const ModerationContentList = ({
  items,
  title,
  focusedItemId,
  onOpenItem,
}: {
  items: ContentItem[];
  title: string;
  focusedItemId: string | null;
  onOpenItem: (itemId: string) => void;
}) => {
  const classes = useStyles(styles);

  return (
    <div className={classes.root}>
      <div className={classes.header}>
        <span className={classes.title}>
          {title}
          <span className={classes.count}>({items.length})</span>
        </span>
      </div>
      {items.length === 0 ? (
        <div className={classes.empty}>
          No {title.toLowerCase()}
        </div>
      ) : (
        <div className={classes.list}>
          {items.map((item) => (
            <ModerationContentItem
              key={item._id}
              item={item}
              isFocused={item._id === focusedItemId}
              onOpen={() => onOpenItem(item._id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ModerationContentList;

