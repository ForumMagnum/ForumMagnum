import React, { useCallback, useState } from "react";
import { registerComponent, Components } from "../../../lib/vulcan-lib/components";
import { AnalyticsContext } from "../../../lib/analyticsEvents";
import { useMulti } from "../../../lib/crud/withMulti";
import MenuItem from "@material-ui/core/MenuItem";
import { Link } from "../../../lib/reactRouterWrapper";
import { tagGetSubforumUrl, tagGetUrl } from "../../../lib/collections/tags/helpers";
import { isEAForum } from "../../../lib/instanceSettings";

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
  showMoreLess: {
    color: `${theme.palette.grey[500]} !important`,
  }
}))

const INITIAL_LIMIT = 3

const SubforumsList = ({ onClick, classes }) => {
  const { results } = useMulti({
    terms: {view: 'coreTags', limit: 100},
    collectionName: "Tags",
    fragmentName: 'TagSubforumSidebarFragment',
    enableTotal: false,
    fetchPolicy: 'cache-and-network',
    skip: !isEAForum
  })
  const [showAll, setShowAll] = useState(false)

  const onClickShowMoreOrLess = useCallback((e) => {
    e.preventDefault() // Prevent ripple
    setShowAll(!showAll)
  }, [showAll])
  
  if (!results || !results.length) return <></>
  
  const initialResults = results.slice(0, INITIAL_LIMIT)
  const maybeHiddenResults = results.slice(INITIAL_LIMIT)
  const displayShowMoreOrLess = results.length > INITIAL_LIMIT

  // MenuItem takes a component and passes unrecognized props to that component,
  // but its material-ui-provided type signature does not include this feature.
  // Cast to any to work around it, to be able to pass a "to" parameter.
  const MenuItemUntyped = MenuItem as any
  
  const { TabNavigationSubItem } = Components
  
  const getListItem = (tag: TagSubforumSidebarFragment) => (
    <MenuItemUntyped
      key={tag._id}
      onClick={onClick}
      component={Link}
      to={tag.isSubforum ? tagGetSubforumUrl(tag) : tagGetUrl(tag)}
      classes={{ root: classes.menuItem }}
    >
      <TabNavigationSubItem className={classes.subItem}>{tag.name}</TabNavigationSubItem>
    </MenuItemUntyped>
  );

  return (
    <span>
      <AnalyticsContext pageSubSectionContext="menuSubforumsList">
        <div>
          {initialResults.map((subforum) => getListItem(subforum))}
          {showAll && maybeHiddenResults.map((subforum) => getListItem(subforum))}
          {displayShowMoreOrLess && (
            <MenuItemUntyped onClick={onClickShowMoreOrLess} className={classes.menuItem} disableRipple>
              <TabNavigationSubItem className={classes.showMoreLess}>
                (show {showAll ? "less" : `${maybeHiddenResults.length} more`})
              </TabNavigationSubItem>
            </MenuItemUntyped>
          )}
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
