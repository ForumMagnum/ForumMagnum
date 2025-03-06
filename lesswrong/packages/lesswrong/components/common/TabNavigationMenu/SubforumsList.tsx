import React, { useCallback, useState } from "react";
import { registerComponent, Components } from "../../../lib/vulcan-lib/components";
import { AnalyticsContext } from "../../../lib/analyticsEvents";
import { useMulti } from "../../../lib/crud/withMulti";
import { tagGetSubforumUrl, tagGetUrl } from "../../../lib/collections/tags/helpers";
import { isEAForum } from "../../../lib/instanceSettings";
import TabNavigationSubItem from "@/components/common/TabNavigationMenu/TabNavigationSubItem";
import { MenuItem, MenuItemLink } from "@/components/common/Menus";

const styles = ((theme: ThemeType) => ({
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
    color: theme.palette.grey[isEAForum ? 600 : 800],
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

const SubforumsList = ({ onClick, classes }: {
  onClick: () => void
  classes: ClassesType<typeof styles>
}) => {
  const { results } = useMulti({
    terms: {view: 'coreTags', limit: 100},
    collectionName: "Tags",
    fragmentName: 'TagSubforumSidebarFragment',
    enableTotal: false,
    fetchPolicy: 'cache-and-network',
    skip: !isEAForum
  })
  const [showAll, setShowAll] = useState(false)

  const onClickShowMoreOrLess = useCallback((e: React.MouseEvent) => {
    e.preventDefault() // Prevent ripple
    setShowAll(!showAll)
  }, [showAll])
  
  if (!results || !results.length) return <></>
  
  const initialResults = results.slice(0, INITIAL_LIMIT)
  const maybeHiddenResults = results.slice(INITIAL_LIMIT)
  const displayShowMoreOrLess = results.length > INITIAL_LIMIT
  const getListItem = (tag: TagSubforumSidebarFragment) => (
    <MenuItemLink
      key={tag._id}
      onClick={onClick}
      to={tag.isSubforum ? tagGetSubforumUrl(tag) : tagGetUrl(tag)}
      className={classes.menuItem}
    >
      <TabNavigationSubItem className={classes.subItem}>{tag.name}</TabNavigationSubItem>
    </MenuItemLink>
  );

  return (
    <span>
      <AnalyticsContext pageSubSectionContext="menuSubforumsList">
        <div>
          {initialResults.map((subforum) => getListItem(subforum))}
          {showAll && maybeHiddenResults.map((subforum) => getListItem(subforum))}
          {displayShowMoreOrLess && (
            <MenuItem onClick={onClickShowMoreOrLess} className={classes.menuItem} disableRipple>
              <TabNavigationSubItem className={classes.showMoreLess}>
                (show {showAll ? "less" : `${maybeHiddenResults.length} more`})
              </TabNavigationSubItem>
            </MenuItem>
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

export default SubforumsListComponent;
