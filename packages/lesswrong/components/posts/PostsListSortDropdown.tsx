import React, { useState } from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import Menu from '@material-ui/core/Menu';
import { QueryLink } from '../../lib/reactRouterWrapper';
import { TAG_POSTS_SORT_ORDER_OPTIONS } from '../../lib/collections/tags/schema';
import { isEAForum } from '../../lib/instanceSettings';
import Button from '@material-ui/core/Button';
import classNames from 'classnames';

// TODO forum gate
const styles = (theme: ThemeType): JssStyles => ({
  root: {
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
    color: theme.palette.grey[600],
    marginRight: 8,
    textAlign: "center",
  },
  button: {
    textTransform: 'none',
    boxShadow: 'none',
    padding: 0,
    fontSize: '14px',
    minHeight: 32,
    cursor: "pointer",
    color: isEAForum ? 'inherit' : theme.palette.primary.main,
    paddingLeft: 8,
    paddingRight: 4,
    backgroundColor: 'transparent',
    '&:hover': {
      backgroundColor: theme.palette.grey[250], // TODO extract out this hover behaviour
      color: theme.palette.grey[1000],
    }
  },
  openButton: {
    backgroundColor: theme.palette.grey[250],
    color: theme.palette.grey[1000],
  },
  dropdownIcon: {
    // TODO check how this affects LW
    verticalAlign: "middle",
    position: "relative",
    width: 16,
    height: 16,
    marginLeft: 4,
  },
  selectedIcon: {
    verticalAlign: "middle",
    position: "relative",
    color: theme.palette.primary.main,
    marginLeft: 10,
    marginRight: 2,
    width: 19,
    height: 19,
  },
  menu: {
    marginTop: 28,
    [theme.breakpoints.down('xs')]: {
      // It tries to stop itself hitting the side of the screen on mobile,
      // add some negative margin to line it back up with the dropdown
      marginLeft: -7,
    }
  },
  menuItem: {
    color: theme.palette.grey[1000],
    borderRadius: theme.borderRadius.small,
    justifyContent: 'space-between',
    padding: '6px 8px',
    margin: '0px 3px',
    fontSize: '14px',
    '&:focus': {
      outline: "none",
    },
    '&:hover': {
      backgroundColor: theme.palette.grey[250], // TODO extract out this hover behaviour
      color: theme.palette.grey[1000],
    }
  },
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
    <Button
        variant="contained"
        onClick={e=>setAnchorEl(e.currentTarget)} // FIXME terrible way to open a menu
        className={classNames(classes.button, {[classes.openButton]: Boolean(anchorEl)})}
      >
      {label} <ForumIcon icon="ThickChevronDown" className={classes.dropdownIcon} />
    </Button>
    <Menu
      open={Boolean(anchorEl)}
      anchorEl={anchorEl}
      onClose={()=>setAnchorEl(null)}
      className={classes.menu}
    >
      {options.map(sorting => (
        <QueryLink key={sorting} query={{[sortingParam]:sorting}} merge>
          <MenuItem value={sorting} onClick={()=>setAnchorEl(null)} className={classes.menuItem}>
            {TAG_POSTS_SORT_ORDER_OPTIONS[sorting].label}
            {sorting === value && <ForumIcon icon="Check" className={classes.selectedIcon}/>}
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
