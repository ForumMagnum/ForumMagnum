import React, { MouseEvent, ReactNode } from 'react';
import { Paper } from '@/components/widgets/Paper';
import LWTooltip from "../common/LWTooltip";
import DropdownItem from "./DropdownItem";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles("ModeratorActionsSubmenu", (_theme: ThemeType) => ({
  submenu: {
    minWidth: 250,
  },
}));

// Some menus close when anything inside them is clicked. Clicking or tapping
// this item is a way of opening the submenu, so it shouldn't count.
const keepParentMenuOpen = (event: MouseEvent) => event.stopPropagation();

/**
 * A menu item which, when hovered, opens a submenu containing actions that
 * are only available because the current user is a moderator or admin. This
 * keeps them separate from the actions that regular users see.
 */
const ModeratorActionsSubmenu = ({children}: {
  children: ReactNode,
}) => {
  const classes = useStyles(styles);
  return <LWTooltip
    title={<Paper className={classes.submenu}>{children}</Paper>}
    tooltip={false}
    clickable
    inlineBlock={false}
    placement="left-start"
  >
    <DropdownItem title="Moderator actions" icon="Settings" onClick={keepParentMenuOpen} />
  </LWTooltip>
}

export default ModeratorActionsSubmenu;
