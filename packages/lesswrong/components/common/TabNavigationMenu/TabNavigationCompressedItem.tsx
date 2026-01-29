import React from 'react';
import { Link } from '../../../lib/reactRouterWrapper';
import classNames from 'classnames';
import { MenuTabRegular } from './menuTabs';
import LWTooltip from "../LWTooltip";
import { MenuItemLink } from "../Menus";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const compressedIconSize = 23

const styles = defineStyles("TabNavigationCompressedItem", (theme: ThemeType) => ({
  icon: {
    display: "block",
    opacity: .6,
    width: compressedIconSize,
    height: compressedIconSize,
    '& svg': {
      fill: "currentColor",
      width: compressedIconSize,
      height: compressedIconSize,
    },
    ...(theme.isFriendlyUI && {
      opacity: 1,
    }),
  },
  navText: {
    ...theme.typography.body2,
    color: theme.palette.grey[700],
    fontSize: '.8rem',
  },
  homeIcon: {
    '& svg': {
      position: "relative",
      top: -1,
    }
  },
}))

type TabNavigationCompressedItemProps = {
  tab: MenuTabRegular,
  onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void,
}

const TabNavigationCompressedItem = ({tab, onClick}: TabNavigationCompressedItemProps) => {
  const classes = useStyles(styles);
  return <LWTooltip placement='right-start' title={tab.tooltip || ''}>
    <MenuItemLink
      onClick={onClick}
      to={tab.link}
    >
      <span
        className={classNames(classes.icon, {[classes.homeIcon]: tab.id === 'home'})}
      >
        {tab.iconComponent && <tab.iconComponent />}
        {tab.icon && tab.icon}
        {tab.compressedIconComponent && <tab.compressedIconComponent />}
      </span>
    </MenuItemLink>
  </LWTooltip>;
}

export default TabNavigationCompressedItem;


