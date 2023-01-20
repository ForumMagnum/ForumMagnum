import React from "react";
import { registerComponent, Components } from "../../../lib/vulcan-lib/components";
import { AnalyticsContext } from "../../../lib/analyticsEvents";
import { useMulti } from "../../../lib/crud/withMulti";
import { Link } from "../../../lib/reactRouterWrapper";
import { tagGetSubforumUrl } from "../../../lib/collections/tags/helpers";

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
  title: {
    paddingLeft: 62,
    paddingBottom: 5,
    ...theme.typography.body2,
    color: theme.palette.grey[800],
  },
  subItem: {
    textTransform: 'capitalize',
    whiteSpace: 'break-spaces !important',
  },
  unreadCount: {
    color: theme.palette.primary.main,
  },
}))

const SubforumsList = ({ onClick, classes }) => {
  const { results } = useMulti({
    terms: {view: 'currentUserSubforums'},
    collectionName: "Tags",
    fragmentName: 'TagSubforumSidebarFragment',
    enableTotal: false,
    fetchPolicy: 'cache-and-network',
  })
  
  if (!results || !results.length) return <></>
  
  const { TabNavigationSubItem, MenuItemLink } = Components
  
  return (
    <span>
      <AnalyticsContext pageSubSectionContext="menuSubforumsList">
        <div>
          <div className={classes.title}>Subforums</div>
          {results.map((subforum) => (
            <MenuItemLink
              key={subforum._id}
              onClick={onClick}
              to={tagGetSubforumUrl(subforum)}
              rootClass={classes.menuItem}
            >
              <TabNavigationSubItem className={classes.subItem}>
                {subforum.name}
              </TabNavigationSubItem>
            </MenuItemLink>
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
