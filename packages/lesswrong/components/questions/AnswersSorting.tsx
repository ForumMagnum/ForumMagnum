import { registerComponent } from '../../lib/vulcan-lib';
import React, { useState } from 'react';
import { useLocation, useNavigation } from '../../lib/routeUtil';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import qs from 'qs'
import * as _ from 'underscore';

export const sortingNames = {
  'top': 'top scoring',
  'newest': 'newest',
  'oldest': 'oldest',
}

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    display: 'inline'
  },
  link: {
    color: theme.palette.lwTertiary.main,
  }
})

const AnswersSorting = ({ post, classes }: {
  post?: PostsList,
  classes: ClassesType,
}) => {
  const [anchorEl, setAnchorEl] = useState<any>(null);
  const { history } = useNavigation();
  const location = useLocation();
  const { query } = location;

  const handleClick = (event: React.MouseEvent) => {
    setAnchorEl(event.currentTarget);
  };

  const handleSortingClick = (sorting: string) => {
    const { query } = location;
    const currentQuery = _.isEmpty(query) ? { answersSorting: "top" } : query;
    setAnchorEl(null);
    const newQuery = { ...currentQuery, answersSorting: sorting, postId: post ? post._id : undefined };
    history.push({ ...location.location, search: `?${qs.stringify(newQuery)}` });
  };

  const handleClose = () => {
    setAnchorEl(null);
  }

  let sortings = [...Object.keys(sortingNames)];
  const currentSorting = query?.answersSorting || "top";

  return <div className={classes.root}>
    <a className={classes.link} onClick={handleClick}>
      {sortingNames[currentSorting]}
    </a>
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={handleClose}
    >
      {sortings.map((sorting) => {
        return <MenuItem key={sorting} onClick={() => handleSortingClick(sorting)} >
          {sortingNames[sorting]}
        </MenuItem>
      })}
    </Menu>
  </div>
};

const AnswersSortingComponent = registerComponent('AnswersSorting', AnswersSorting, { styles });

declare global {
  interface ComponentTypes {
    AnswersSorting: typeof AnswersSortingComponent,
  }
}

