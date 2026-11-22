import React from 'react';
import classNames from 'classnames';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';

export const SECTION_SELECTOR = '[data-moderation-sidebar-section="true"]';
export const SECTION_BODY_SELECTOR = '[data-moderation-sidebar-section-body="true"]';
export const FILLS_SPACE_SELECTOR = '[data-moderation-sidebar-fills-space="true"]';
export const SHARES_SPACE_SELECTOR = '[data-moderation-sidebar-shares-space="true"]';
export const SPACE_ATTRIBUTES = ['data-moderation-sidebar-fills-space', 'data-moderation-sidebar-shares-space'];

const styles = defineStyles('ModerationSidebarSection', (theme: ThemeType) => ({
  root: {
    flex: '0 1 auto',
    minWidth: 0,
    minHeight: 0,
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    padding: 12,
    backgroundColor: theme.palette.background.paper,
  },
  header: {
    flexShrink: 0,
  },
  // Only the body scrolls, so the header stays pinned to the top of the section
  body: {
    flex: '1 1 auto',
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'auto',
  },
  withDivider: {
    borderBottom: theme.palette.border.normal,
  },
  fillsAvailableSpace: {
    flex: '1 1 0',
  },
}));

const ModerationSidebarSection = ({
  header,
  children,
  fillsAvailableSpace = false,
  sharesAvailableSpace = false,
  withDivider = true,
}: {
  header: React.ReactNode;
  children?: React.ReactNode;
  fillsAvailableSpace?: boolean;
  sharesAvailableSpace?: boolean;
  withDivider?: boolean;
}) => {
  const classes = useStyles(styles);

  return (
    <div
      className={classNames(classes.root, {
        [classes.withDivider]: withDivider,
        [classes.fillsAvailableSpace]: fillsAvailableSpace,
      })}
      data-moderation-sidebar-section="true"
      data-moderation-sidebar-fills-space={fillsAvailableSpace ? 'true' : undefined}
      data-moderation-sidebar-shares-space={sharesAvailableSpace ? 'true' : undefined}
    >
      <div className={classes.header}>{header}</div>
      <div className={classes.body} data-moderation-sidebar-section-body="true">
        {children}
      </div>
    </div>
  );
};

export default ModerationSidebarSection;
