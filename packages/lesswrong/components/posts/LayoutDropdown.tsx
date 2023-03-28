import React, { useState } from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import Menu from '@material-ui/core/Menu';
import { QueryLink } from '../../lib/reactRouterWrapper';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import { TAG_POSTS_SORT_ORDER_OPTIONS } from '../../lib/collections/tags/schema';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
    color: theme.palette.grey[600],
    marginBottom: 8,
    textAlign: "center",
  },
  selectMenu: {
    cursor: "pointer",
    paddingLeft: 4,
    color: theme.palette.primary.main
  },
  noBreak: {
    whiteSpace: "nowrap"
  },
  icon: {
    verticalAlign: "middle",
    position: "relative",
    top: -2,
    left: -2
  },
  menuItem: {
    '&:focus': {
      outline: "none",
    }
  }
})

const defaultOptions = Object.keys(TAG_POSTS_SORT_ORDER_OPTIONS);

// TODO maybe rename to something posts specific
const LayoutDropdown = ({layout = "list", classes}:{
  layout?: string,
  classes: ClassesType,
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)

  return <div className={classes.root}>
    TODO
  </div>
}

const LayoutDropdownComponent = registerComponent('LayoutDropdown', LayoutDropdown, {styles});

declare global {
  interface ComponentTypes {
    LayoutDropdown: typeof LayoutDropdownComponent
  }
}
