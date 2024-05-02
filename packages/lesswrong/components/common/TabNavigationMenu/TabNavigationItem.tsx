import { registerComponent, Components } from '../../../lib/vulcan-lib';
import React from 'react';
import classNames from 'classnames';
import { useLocation } from '../../../lib/routeUtil';
import { MenuTabRegular } from './menuTabs';
import { forumSelect } from '../../../lib/forumTypeUtils';
import { isFriendlyUI } from '../../../themes/forumTheme';
import { useCurrentUser } from '../withUser';

export const iconWidth = 30

const iconTransform = forumSelect({
  LessWrong: "scale(0.8)",
  EAForum: "scale(0.7)",
  default: undefined,
});

const styles = (theme: ThemeType) => ({
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
    width: isFriendlyUI ? 210 : 190,
  },
  desktopOnly: {
    [theme.breakpoints.down("xs")]: {
      display: "none !important",
    },
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
  flag: {
    padding: "2px 4px",
    marginLeft: 10,
    fontSize: 11,
    fontWeight: 600,
    lineHeight: "110%",
    letterSpacing: "0.33px",
    textTransform: "uppercase",
    background: theme.palette.primary.main,
    borderRadius: theme.borderRadius.small,
    color: theme.palette.text.alwaysWhite,
  },
});

export type TabNavigationItemProps = {
  tab: MenuTabRegular,
  onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void,
  className?: string,
  classes: ClassesType<typeof styles>,
}

const TabNavigationItem = ({tab, onClick, className, classes}: TabNavigationItemProps) => {
  const {pathname} = useLocation();
  const currentUser = useCurrentUser();

  if (tab.betaOnly && !currentUser?.beta) {
    return null;
  }

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

  const { TabNavigationSubItem, LWTooltip, MenuItemLink } = Components;
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
      rootClass={classNames(classes.menuItem, className, {
        [classes.navButton]: !tab.subItem,
        [classes.subItemOverride]: tab.subItem,
        [classes.selected]: isSelected,
        [classes.desktopOnly]: tab.desktopOnly,
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
      {tab.flag && <span className={classes.flag}>{tab.flag}</span>}
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
