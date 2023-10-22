import { registerComponent, Components } from '../../../lib/vulcan-lib';
import React from 'react';
import classNames from 'classnames';
import { useLocation } from '../../../lib/routeUtil';
import { MenuTabRegular } from './menuTabs';
import { forumSelect } from '../../../lib/forumTypeUtils';
import { isFriendlyUI } from '../../../themes/forumTheme';

export const iconWidth = 30

const iconTransform = forumSelect({
  LessWrong: "scale(0.8)",
  EAForum: "scale(0.7)",
  default: undefined,
});

const styles = (theme: ThemeType): JssStyles => ({
  selected: {
    '& $icon': {
      opacity: 1,
    },
    '& $navText': {
      color: theme.palette.grey[isFriendlyUI ? 1000 : 900],
      fontWeight: 600,
    },
  },
  menuItem: {
    width: 190,
  },
  navButton: {
    '&:hover': {
      opacity: isFriendlyUI ? 1 : 0.6,
      color: isFriendlyUI ? theme.palette.grey[800] : undefined,
      backgroundColor: 'transparent' // Prevent MUI default behavior of rendering solid background on hover
    },
    color: theme.palette.grey[isFriendlyUI ? 600 : 800],
    ...(theme.forumType === "LessWrong"
      ? {
        paddingTop: 7,
        paddingBottom: 8,
        paddingLeft: 16,
        paddingRight: 16,
      } : {
        padding: 16,
      }
    ),
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
    flexDirection: "row",
  },
  subItemOverride: {
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: 0,
    paddingRight: 0,
    '&:hover': {
      backgroundColor: 'transparent', // Prevent MUI default behavior of rendering solid background on hover
      opacity: isFriendlyUI ? 1 : undefined,
    }
  },
  icon: {
    opacity: .3,
    width: iconWidth,
    height: 28,
    marginRight: 16,
    display: "inline",
    "& svg": {
      fill: isFriendlyUI ? undefined : "currentColor",
      color: isFriendlyUI ? undefined : theme.palette.icon.navigationSidebarIcon,
      transform: iconTransform,
    },
  },
  selectedIcon: {
    "& svg": {
      color: isFriendlyUI ? theme.palette.grey[1000] : undefined,
    },
  },
  navText: {
    ...theme.typography.body2,
    color: "inherit",
    textTransform: "none !important",
  },
  homeIcon: {
    '& svg': {
      height: 29,
      position: "relative",
      top: -1,
    }
  },
  tooltip: {
    maxWidth: isFriendlyUI ? 190 : undefined,
  },
})

type TabNavigationItemProps = {
  tab: MenuTabRegular,
  onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void,
  classes: ClassesType,
}

const TabNavigationItem = ({tab, onClick, classes}: TabNavigationItemProps) => {
  const { TabNavigationSubItem, LWTooltip, MenuItemLink } = Components
  const { pathname } = useLocation()
  
  // Due to an issue with using anchor tags, we use react-router links, even for
  // external links, we just use window.open to actuate the link.
  const externalLink = /https?:\/\//.test(tab.link);
  let handleClick = onClick
  if (externalLink) {
    handleClick = (e) => {
      e.preventDefault()
      window.open(tab.link, '_blank')?.focus()
      onClick && onClick(e)
    }
  }

  const isSelected = pathname === tab.link;
  const hasIcon = tab.icon || tab.iconComponent || tab.selectedIconComponent;
  const IconComponent = isSelected
    ? tab.selectedIconComponent ?? tab.iconComponent
    : tab.iconComponent;

  return <LWTooltip
    placement='right-start'
    title={tab.tooltip || ''}
    className={classes.tooltip}
  >
    <MenuItemLink
      onClick={handleClick}
      // We tried making this [the 'component' of the underlying material-UI
      // MenuItem component] a function that return an a tag once. It made the
      // entire sidebar fail on iOS. True story.
      to={tab.link}
      disableGutters
      rootClass={classNames(classes.menuItem, {
        [classes.navButton]: !tab.subItem,
        [classes.subItemOverride]: tab.subItem,
        [classes.selected]: isSelected,
      })}
      disableTouchRipple
    >
      {hasIcon && <span className={classNames(classes.icon, {
        [classes.selectedIcon]: isSelected,
        [classes.homeIcon]: tab.id === 'home',
      })}>
        {IconComponent && <IconComponent />}
        {tab.icon && tab.icon}
      </span>}
      {tab.subItem ?
        <TabNavigationSubItem>
          {tab.title}
        </TabNavigationSubItem> :
        <span className={classes.navText}>
          {tab.title}
        </span>
      }
    </MenuItemLink>
  </LWTooltip>
}

const TabNavigationItemComponent = registerComponent(
  'TabNavigationItem', TabNavigationItem, {styles}
);

declare global {
  interface ComponentTypes {
    TabNavigationItem: typeof TabNavigationItemComponent
  }
}
