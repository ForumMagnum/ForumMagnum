import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';
import classNames from 'classnames';
import { Ref } from 'react';
import { Link } from '../../../lib/reactRouterWrapper';
import { useLocation } from '../../../lib/routeUtil';
import { TooltipRef } from '../FMTooltip';
import { MenuTabRegular } from './menuTabs';
import TabNavigationSubItem from "./TabNavigationSubItem";

const smallIconSize = 23

const styles = defineStyles("TabNavigationFooterItem", (theme: ThemeType) => ({
  selected: {
    '& $icon': {
      opacity: 1
    },
    '& $navText': {
      color: theme.palette.grey[900],
      fontWeight: 600,
    },
    backgroundColor: theme.palette.grey[400]
  },
  navButton: {
    paddingTop: theme.spacing.unit,
    paddingBottom: 2,
    paddingLeft: theme.spacing.unit,
    paddingRight: theme.spacing.unit,
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-around",
    flexDirection: "column",
    ...({}),
  },
  icon: {
    display: "block",
    opacity: 0.45,
    width: smallIconSize,
    height: smallIconSize,
    '& svg': {
      width: smallIconSize,
      height: smallIconSize,
      fill: "currentColor"
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
}))

type TabNavigationFooterItemProps = {
  tab: MenuTabRegular,
}

const TabNavigationFooterItem = ({tab}: TabNavigationFooterItemProps) => {
  const classes = useStyles(styles);
  const { pathname } = useLocation()
  // React router links don't handle external URLs, so use a
  // normal HTML a tag if the URL is external
  const externalLink = /https?:\/\//.test(tab.link);
  const Element = externalLink ?
    ({to, anchorRef, ...rest}: { to: string, anchorRef: Ref<HTMLAnchorElement>, className: string }) =>
      <a href={to} target="_blank" rel="noopener noreferrer" ref={anchorRef} {...rest} />
    : Link;

  const isSelected = pathname === tab.link;
  const hasIcon = tab.icon || tab.iconComponent || tab.selectedIconComponent;
  const IconComponent = isSelected
    ? tab.selectedIconComponent ?? tab.iconComponent
    : tab.iconComponent;

  return <TooltipRef placement='top' title={tab.tooltip || ''} distance={16}>
    {(ref: Ref<HTMLAnchorElement>) => <Element
      to={tab.link}
      anchorRef={ref}
      className={classNames(classes.navButton, {
        [classes.selected]: isSelected,
      })}
    >
      {hasIcon && <span
        className={classNames(classes.icon, {[classes.homeIcon]: tab.id === 'home'})}
      >
        {IconComponent && <IconComponent />}
        {tab.icon && tab.icon}
      </span>}
      {tab.subItem ?
        <TabNavigationSubItem>
          { tab.mobileTitle || tab.title }
        </TabNavigationSubItem> :
        <span className={classes.navText}>
          { tab.mobileTitle || tab.title }
        </span>
      }
    </Element>}
  </TooltipRef>
}

export default TabNavigationFooterItem;


