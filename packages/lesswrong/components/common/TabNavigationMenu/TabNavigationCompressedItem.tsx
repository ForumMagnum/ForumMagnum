import { Components, registerComponent } from '../../../lib/vulcan-lib/components';
import React from 'react';
import { Link } from '../../../lib/reactRouterWrapper';
import classNames from 'classnames';
import { MenuTabRegular } from './menuTabs';
import { isFriendlyUI } from '@/themes/forumTheme';

const compressedIconSize = 23

const styles = (theme: ThemeType) => ({
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
    ...(isFriendlyUI && {
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
})

type TabNavigationCompressedItemProps = {
  tab: MenuTabRegular,
  onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void,
  classes: ClassesType<typeof styles>,
}

const TabNavigationCompressedItem = ({tab, onClick, classes}: TabNavigationCompressedItemProps) => {
  const { LWTooltip, MenuItemLink } = Components
  
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

const TabNavigationCompressedItemComponent = registerComponent(
  'TabNavigationCompressedItem', TabNavigationCompressedItem, {styles}
);

declare global {
  interface ComponentTypes {
    TabNavigationCompressedItem: typeof TabNavigationCompressedItemComponent
  }
}
