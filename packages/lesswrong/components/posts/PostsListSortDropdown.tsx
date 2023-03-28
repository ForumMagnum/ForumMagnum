import React, { useState } from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import Menu from '@material-ui/core/Menu';
import { QueryLink } from '../../lib/reactRouterWrapper';
import { TAG_POSTS_SORT_ORDER_OPTIONS } from '../../lib/collections/tags/schema';
import { isEAForum } from '../../lib/instanceSettings';
import Button from '@material-ui/core/Button';

// TODO forum gate
const styles = (theme: ThemeType): JssStyles => ({
  root: {
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
    color: theme.palette.grey[600],
    marginTop: 8,
    marginBottom: 8,
    marginRight: 8,
    textAlign: "center",
  },
  selectMenu: {
    textTransform: 'none',
    boxShadow: 'none',
    padding: 0,
    fontSize: '14px',
    minHeight: 32,
    cursor: "pointer",
    color: isEAForum ? 'inherit' : theme.palette.primary.main,
    paddingLeft: 6,
    paddingRight: 4,
    backgroundColor: 'transparent',
    '&:hover': {
      backgroundColor: theme.palette.grey[200],
      color: theme.palette.grey[1000],
    }
  },
  noBreak: {
    whiteSpace: "nowrap"
  },
  icon: {
    // TODO check how this affects LW
    verticalAlign: "middle",
    position: "relative",
    top: -1,
    left: -2,
    width: 16,
    height: 16,
    marginLeft: 4,
  },
  menuItem: {
    '&:focus': {
      outline: "none",
    }
  }
})

const defaultOptions = Object.keys(TAG_POSTS_SORT_ORDER_OPTIONS);

const PostsListSortDropdown = ({classes, value, options=defaultOptions, sortingParam="sortedBy"}:{
  classes: ClassesType,
  value: string
  options?: string[],
  sortingParam?: string,
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const label = TAG_POSTS_SORT_ORDER_OPTIONS[value].label
  const { MenuItem, ForumIcon } = Components;

  return <div className={classes.root}>
    {/* FIXME change to a MUI button */}
    {/* <span className={classes.selectMenu} onClick={e=>setAnchorEl(e.currentTarget)}>
      {label} <ForumIcon icon="ThickChevronDown" className={classes.icon} />
    </span> */}
    <Button
        variant="contained"
        onClick={e=>setAnchorEl(e.currentTarget)} // FIXME terrible way to open a menu
        className={classes.selectMenu}
      >
        {label} <ForumIcon icon="ThickChevronDown" className={classes.icon} />
      </Button>
    <Menu
      open={Boolean(anchorEl)}
      anchorEl={anchorEl}
      onClose={()=>setAnchorEl(null)}
    >
      {options.map(sorting => (
        <QueryLink key={sorting} query={{[sortingParam]:sorting}} merge>
          <MenuItem value={sorting} onClick={()=>setAnchorEl(null)}>
            {TAG_POSTS_SORT_ORDER_OPTIONS[sorting].label}
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
