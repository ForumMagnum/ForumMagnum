import React, { useState } from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import Menu from '@material-ui/core/Menu';
import { QueryLink } from '../../lib/reactRouterWrapper';
import { isEAForum } from '../../lib/instanceSettings';
import Button from '@material-ui/core/Button';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import classNames from 'classnames';
import { defaultPostsLayout, SettingsOption } from '../../lib/collections/posts/dropdownOptions';
import { useTracking } from '../../lib/analyticsEvents';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
    color: theme.palette.grey[600],
    textAlign: "center",
    ...(!isEAForum && {
      "& button:hover": {
        backgroundColor: "transparent",
      },
    }),
  },
  button: {
    textTransform: "none",
    boxShadow: "none",
    padding: 0,
    fontSize: "14px",
    minHeight: 32,
    minWidth: 'unset',
    cursor: "pointer",
    color: theme.palette.primary.main,
    paddingLeft: 12,
    paddingRight: 6,
    backgroundColor: "transparent",
    ...(isEAForum && {
      color: "inherit",
      "&:hover": {
        backgroundColor: theme.palette.grey[250],
        color: theme.palette.grey[1000],
      },
    }),
  },
  openButton: {
    ...(isEAForum && {
      backgroundColor: theme.palette.grey[250],
      color: theme.palette.grey[1000],
    }),
  },
  dropdownIcon: {
    verticalAlign: "middle",
    position: "relative",
    ...(isEAForum && { width: 16, height: 16, marginLeft: 4, padding: 1}),
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
    ...(isEAForum && {
      "& a:hover": {
        opacity: "inherit",
      },
    }),
    '& .MuiList-padding': {
      padding: '4px 0px',
    }
  },
  menuItem: {
    ...(isEAForum && {
      color: theme.palette.grey[1000],
      borderRadius: theme.borderRadius.small,
      padding: "6px 8px",
      margin: "0px 4px",
      fontSize: "14px",
      lineHeight: "14px",
      "&:hover": {
        backgroundColor: theme.palette.grey[250],
        color: theme.palette.grey[1000],
      },
    }),
    "&:focus": {
      outline: "none",
    },
  },
});

const ForumDropdown = ({value=defaultPostsLayout, options, queryParam="layout", onSelect, eventProps, classes, className}:{
  value: string,
  options: Record<string, SettingsOption>,
  queryParam?: string,
  onSelect?: (value: string) => void,
  eventProps?: Record<string, string>
  classes: ClassesType,
  className?: string,
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const { captureEvent } = useTracking()
  const label = options[value].shortLabel || options[value].label
  const { MenuItem, ForumIcon } = Components;

  const dropdownIcon = isEAForum ? <ForumIcon icon="ThickChevronDown" className={classes.dropdownIcon} /> : <ArrowDropDownIcon className={classes.dropdownIcon}/>
  return (
    <div className={classNames(classes.root, className)}>
      <Button
        variant="contained"
        onClick={(e) => {
          captureEvent("forumDropdownOpened", {value, ...eventProps})
          setAnchorEl(e.currentTarget)
        }}
        className={classNames(classes.button, { [classes.openButton]: Boolean(anchorEl) })}
      >
        {label} {dropdownIcon}
      </Button>
      <Menu open={Boolean(anchorEl)} anchorEl={anchorEl} onClose={() => setAnchorEl(null)} className={classes.menu}>
        {Object.keys(options).map((option) => (
          <QueryLink key={option} query={{ [queryParam]: option }} merge>
            <MenuItem
              value={option}
              onClick={() => {
                captureEvent("forumDropdownItemSelected", {oldValue: value, newValue: option, ...eventProps})
                setAnchorEl(null);
                onSelect?.(option);
              }}
              className={classes.menuItem}
            >
              {options[option].label}
              {option === value && isEAForum && (
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
