import React, { useState } from 'react';
import { registerComponent } from '../../lib/vulcan-lib';
import MenuItem from '@material-ui/core/MenuItem';
import Menu from '@material-ui/core/Menu';
import { QueryLink } from '../../lib/reactRouterWrapper';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import { SORT_ORDER_OPTIONS } from '../../lib/collections/posts/schema';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
    color: theme.palette.grey[600],
    marginTop: theme.spacing.unit,
    marginBottom: theme.spacing.unit
  },
  selectMenu: {
    cursor: "pointer",
    paddingLeft: 4,
    color: theme.palette.primary.main
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

const PostsListSortDropdown = ({classes, value}:{
  classes: ClassesType,
  value: string
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  
  const newSortings = {
    ...SORT_ORDER_OPTIONS,
    relevance: "Most Relevant"
  }

  return <div className={classes.root}>
    <span className={classes.selectMenu} onClick={e=>setAnchorEl(e.currentTarget)}>
      {newSortings[value]} <ArrowDropDownIcon className={classes.icon}/>
    </span>
    <Menu
      open={Boolean(anchorEl)}
      anchorEl={anchorEl}
      onClose={()=>setAnchorEl(null)}
    >
        <QueryLink query={{sortedBy: undefined}} merge className={classes.menuItem}>
          <MenuItem value={"relevance"} onClick={()=>setAnchorEl(null)}>
            {newSortings["relevance"]}
          </MenuItem>
        </QueryLink>
        {Object.keys(SORT_ORDER_OPTIONS).map(sorting => (
          <QueryLink key={sorting} query={{sortedBy:sorting}} merge>
            <MenuItem value={sorting} onClick={()=>setAnchorEl(null)}>
              {newSortings[sorting]}
            </MenuItem>
          </QueryLink>
        ))}
    </Menu>
  </div>
}

const PostsListSortDropdownComponent = registerComponent('PostsListSortDropdown', PostsListSortDropdown, {styles});

declare global {
  interface ComponentTypes {
    PostsListSortDropdown: typeof PostsListSortDropdownComponent
  }
}
