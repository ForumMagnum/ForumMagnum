import React, { useState } from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import Menu from '@material-ui/core/Menu';
import { QueryLink } from '../../lib/reactRouterWrapper';
import { isEAForum } from '../../lib/instanceSettings';
import Button from '@material-ui/core/Button';
import classNames from 'classnames';
import { defaultPostsLayout, SettingsOption } from '../../lib/collections/posts/dropdownOptions';

// TODO forum gate
const styles = (theme: ThemeType): JssStyles => ({
  root: {
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
    color: theme.palette.grey[600],
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
      backgroundColor: theme.palette.grey[250],
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
  padding: {
    width: 10,
  },
  selectedIcon: {
    verticalAlign: "middle",
    position: "relative",
    color: theme.palette.primary.main,
    marginLeft: "auto",
    marginRight: 2,
    width: 19,
    height: 19,
  },
  menu: {
    marginTop: 28,
    '& a:hover': {
      opacity: 'inherit',
    },
    [theme.breakpoints.down('xs')]: {
      // It tries to stop itself hitting the side of the screen on mobile,
      // add some negative margin to line it back up with the dropdown
      marginLeft: -7,
    }
  },
  menuItem: {
    color: theme.palette.grey[1000],
    borderRadius: theme.borderRadius.small,
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

const ForumDropdown = ({value=defaultPostsLayout, options, queryParam="layout", onSelect, classes, className}:{
  value: string,
  options: Record<string, SettingsOption>,
  queryParam?: string,
  onSelect?: (value: string) => void,
  classes: ClassesType,
  className?: string,
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const label = options[value].shortLabel || options[value].label
  const { MenuItem, ForumIcon } = Components;

  return (
    <div className={classNames(classes.root, className)}>
      <Button
        variant="contained"
        onClick={(e) => setAnchorEl(e.currentTarget)}
        className={classNames(classes.button, { [classes.openButton]: Boolean(anchorEl) })}
      >
        {label} <ForumIcon icon="ThickChevronDown" className={classes.dropdownIcon} />
      </Button>
      <Menu open={Boolean(anchorEl)} anchorEl={anchorEl} onClose={() => setAnchorEl(null)} className={classes.menu}>
        {Object.keys(options).map((option) => (
          <QueryLink key={option} query={{ [queryParam]: option }} merge>
            <MenuItem
              value={option}
              onClick={() => {
                setAnchorEl(null);
                onSelect?.(option)
              }}
              className={classes.menuItem}
            >
              {options[option].label}
              {option === value && (
                <>
                  <div className={classes.padding}></div>
                  <ForumIcon icon="Check" className={classes.selectedIcon} />
                </>
              )}
            </MenuItem>
          </QueryLink>
        ))}
      </Menu>
    </div>
  );
}

const ForumDropdownComponent = registerComponent('ForumDropdown', ForumDropdown, {styles});

declare global {
  interface ComponentTypes {
    ForumDropdown: typeof ForumDropdownComponent
  }
}
