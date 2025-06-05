import React, { useCallback, useState } from "react";
import { registerComponent } from "../../../lib/vulcan-lib/components";
import { AnalyticsContext } from "../../../lib/analyticsEvents";
import { tagGetSubforumUrl, tagGetUrl } from "../../../lib/collections/tags/helpers";
import { isEAForum } from "../../../lib/instanceSettings";
import TabNavigationSubItem from "./TabNavigationSubItem";
import { MenuItemLink, MenuItem } from "../Menus";
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen/gql";

const TagSubforumSidebarFragmentMultiQuery = gql(`
  query multiTagSubforumsListQuery($selector: TagSelector, $limit: Int, $enableTotal: Boolean) {
    tags(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...TagSubforumSidebarFragment
      }
      totalCount
    }
  }
`);

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
  const { data } = useQuery(TagSubforumSidebarFragmentMultiQuery, {
    variables: {
      selector: { coreTags: {} },
      limit: 100,
      enableTotal: false,
    },
    skip: !isEAForum,
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
  });

  const results = data?.tags?.results;
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

export default registerComponent("SubforumsList", SubforumsList, {styles});


