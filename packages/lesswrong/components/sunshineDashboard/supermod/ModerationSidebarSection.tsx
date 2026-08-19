import React from 'react';
import classNames from 'classnames';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles('ModerationSidebarSection', (theme: ThemeType) => ({
  root: {
    flex: '0 1 auto',
    minWidth: 0,
    minHeight: 0,
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'auto',
    padding: 12,
    backgroundColor: theme.palette.background.paper,
    // Flexible spacers vertically center short content, then shrink away before
    // the section itself needs to scroll.
    '&::before, &::after': {
      content: '""',
      flex: '1 1 0',
      minHeight: 0,
    },
  },
  withDivider: {
    borderBottom: theme.palette.border.normal,
  },
  fillsAvailableSpace: {
    flex: '1 1 0',
  },
}));

const ModerationSidebarSection = ({
  children,
  fillsAvailableSpace = false,
  hasHighlightedItems = false,
  withDivider = true,
}: {
  children: React.ReactNode;
  fillsAvailableSpace?: boolean;
  hasHighlightedItems?: boolean;
  withDivider?: boolean;
}) => {
  const classes = useStyles(styles);

  return (
    <div
      className={classNames(classes.root, {
        [classes.withDivider]: withDivider,
        [classes.fillsAvailableSpace]: fillsAvailableSpace,
      })}
      data-moderation-sidebar-fills-space={fillsAvailableSpace ? 'true' : undefined}
      data-moderation-sidebar-highlights={hasHighlightedItems ? 'true' : undefined}
    >
      {children}
    </div>
  );
};

export default ModerationSidebarSection;
