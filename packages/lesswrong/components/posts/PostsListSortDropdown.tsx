import React, { useState } from 'react';
import { registerComponent } from '../../lib/vulcan-lib';
import { sortings } from './AllPostsPage';
import { FILTERS_ALL } from './PostsListSettings';
import Select from '@material-ui/core/Select';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import { useLocation } from '../../lib/routeUtil';

const styles = theme => ({
  root: {
    ...theme.typography.commentStyle,
    color: theme.palette.grey[600]
  },
  icon: {
    display: "none"
  }
})

const PostsListSortDropdown = ({classes, defaultValue}:{
  classes: ClassesType,
  defaultValue: string
}) => {
  const [anchorEl, setAnchorEl] = useState(null)
  const [sortedBy, setSortedBy] = useState(defaultValue)
  const { query } = useLocation()

  const setCurrentTarget = (event) => {

  }
  

  return <div className={classes.root}>
    Sorted by <Select value={sortings[sortedBy]}>
        {Object.keys(sortings).map(sorting => <MenuItem key={sorting} onClick={()=>setSortedBy(sorting)}>
          {sortings[sorting]}
        </MenuItem>)}
      </Select>
    </div>
}

const PostsListSortDropdownComponent = registerComponent('PostsListSortDropdown', PostsListSortDropdown, {styles});

declare global {
  interface ComponentTypes {
    PostsListSortDropdown: typeof PostsListSortDropdownComponent
  }
}
