import { registerComponent, Components } from '../../../lib/vulcan-lib';
import React from 'react';
import MenuItem from '@material-ui/core/MenuItem';
import { Link } from '../../../lib/reactRouterWrapper';
import classNames from 'classnames';
import { MenuTabRegular } from './menuTabs';

const compressedIconSize = 23

const styles = (theme: ThemeType): JssStyles => ({
  icon: {
    display: "block",
    opacity: .6,
    width: compressedIconSize,
    height: compressedIconSize,
    '& svg': {
      fill: "currentColor",
      width: compressedIconSize,
      height: compressedIconSize,
    }
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
  classes: ClassesType,
}

const TabNavigationCompressedItem = ({tab, onClick, classes}: TabNavigationCompressedItemProps) => {
  // MenuItem takes a component and passes unrecognized props to that component,
  // but its material-ui-provided type signature does not include this feature.
  // Case to any to work around it, to be able to pass a "to" parameter.
  const MenuItemUntyped = MenuItem as any;
  const { LWTooltip } = Components
  
  return <LWTooltip placement='right-start' title={tab.tooltip || ''}>
    <MenuItemUntyped
      onClick={onClick}
      component={Link} to={tab.link}
    >
      <span
        className={classNames(classes.icon, {[classes.homeIcon]: tab.id === 'home'})}
      >
        {tab.iconComponent && <tab.iconComponent />}
        {tab.icon && tab.icon}
        {tab.compressedIconComponent && <tab.compressedIconComponent />}
      </span>
    </MenuItemUntyped>
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
