import { registerComponent } from '../../lib/vulcan-lib';
import React, { useState } from 'react';
import { useLocation, useNavigation } from '../../lib/routeUtil';
import { userCanDo } from '../../lib/vulcan-users/permissions';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import { commentGetDefaultView } from '../../lib/collections/comments/helpers'
import { useCurrentUser } from '../common/withUser';
import qs from 'qs'
import { isEmpty } from 'underscore';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    display: 'inline'
  },
  link: {
    color: theme.palette.lwTertiary.main,
  }
})

interface Option<T extends string | number> {
  value: T,
  label: string,
}

function SelectSorting<T extends string | number>({options, selected, handleSelect, classes}: {
  options: Option<T>[],
  selected: Option<T>,
  handleSelect: (value: T) => void,
  classes: ClassesType,
}) {
  const [anchorEl,setAnchorEl] = useState<any>(null);

  const handleClick = (event: React.MouseEvent) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  }

  return <div className={classes.root}>
    <a className={classes.link} onClick={handleClick}>
      {selected.label}
    </a>
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={handleClose}
    >
      {options.map((option: Option<T>) => {
        return <MenuItem key={option.value} onClick={() => handleSelect(option.value)} >
          {option.label}
        </MenuItem>
      })}
    </Menu>
  </div>
};

const SelectSortingComponent = registerComponent('SelectSorting', SelectSorting, {styles});

declare global {
  interface ComponentTypes {
    SelectSorting: typeof SelectSortingComponent,
  }
}

