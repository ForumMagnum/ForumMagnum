import React from "react";
import { registerComponent, Components } from "../../../lib/vulcan-lib/components";
import { AnalyticsContext } from "../../../lib/analyticsEvents";
import { useMulti } from "../../../lib/crud/withMulti";
import MenuItem from "@material-ui/core/MenuItem";
import { Link } from "../../../lib/reactRouterWrapper";
import { tagGetSubforumUrl } from "../../../lib/collections/tags/helpers";
import { taggingNamePluralCapitalSetting, taggingNamePluralSetting } from "../../../lib/instanceSettings";

const styles = ((theme: ThemeType): JssStyles => ({
  menuItem: {
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: 0,
    paddingRight: 0,
    '&:hover': {
      backgroundColor: 'transparent' // Prevent MUI default behavior of rendering solid background on hover
    },
    whiteSpace: 'break-spaces',
    height: 'unset',
    minHeight: 24,
  },
  subItem: {
    textTransform: 'capitalize',
    whiteSpace: 'break-spaces !important',
  },
  unreadCount: {
    color: theme.palette.primary.main,
  },
  subforumsHeader: {
    ...theme.typography.body2,
    color: theme.palette.grey[800],
    paddingLeft: 62,
    paddingBottom: 8,
    fontSize: '1rem',
    fontWeight: 500,
  }
}))

const SubforumsList = ({ onClick, classes }) => {
  const { results, loading } = useMulti({
    terms: {view: 'currentUserSubforums'},
    collectionName: "Tags",
    fragmentName: 'TagSubforumSidebarFragment',
    enableTotal: false,
    fetchPolicy: 'cache-and-network',
  })

  // MenuItem takes a component and passes unrecognized props to that component,
  // but its material-ui-provided type signature does not include this feature.
  // Cast to any to work around it, to be able to pass a "to" parameter.
  const MenuItemUntyped = MenuItem as any

  const { TabNavigationSubItem, Loading, LWTooltip } = Components

  return (
    <span>
      <AnalyticsContext pageSubSectionContext="menuSubforumsList">
        <div>
          <MenuItemUntyped
            key={"wiki"}
            onClick={onClick}
            component={Link}
            to={`/${taggingNamePluralSetting.get()}/all`}
            classes={{ root: classes.menuItem }}
          >
            <TabNavigationSubItem className={classes.subItem}>
              <LWTooltip title={`A sorted list of pages — “${taggingNamePluralCapitalSetting.get()}” — in the EA Forum Wiki, which explains ${taggingNamePluralSetting.get()} in EA and collects posts tagged with those ${taggingNamePluralSetting.get()}.`}>
                EA Wiki
              </LWTooltip>
            </TabNavigationSubItem>
          </MenuItemUntyped>
          {loading && !results?.length && <Loading />}
          {!!results?.length && <div className={classes.subforumsHeader}>Subforums</div>}
          {results?.map((subforum) => (
            <MenuItemUntyped
              key={subforum._id}
              onClick={onClick}
              component={Link}
              to={tagGetSubforumUrl(subforum)}
              classes={{ root: classes.menuItem }}
            >
              <TabNavigationSubItem className={classes.subItem}>{subforum.name}</TabNavigationSubItem>
            </MenuItemUntyped>
          ))}
        </div>
      </AnalyticsContext>
    </span>
  );
}

const SubforumsListComponent = registerComponent("SubforumsList", SubforumsList, {styles})

declare global {
  interface ComponentTypes {
    SubforumsList: typeof SubforumsListComponent;
  }
}
