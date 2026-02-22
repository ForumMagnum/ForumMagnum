import { Menu } from '@/components/widgets/Menu';
import Button from '@/lib/vendor/@material-ui/core/src/Button';
import ArrowDropDownIcon from '@/lib/vendor/@material-ui/icons/src/ArrowDropDown';
import classNames from 'classnames';
import { useState } from 'react';
import { SettingsOption } from '../../lib/collections/posts/dropdownOptions';
import { QueryLink } from '../../lib/reactRouterWrapper';
import { defineStyles } from '../hooks/defineStyles';
import { useStyles } from '../hooks/useStyles';
import ForumIcon from "./ForumIcon";
import { MenuItem } from "./Menus";

const styles = defineStyles("ForumDropdownMultiselect", (theme: ThemeType) => ({
  root: {
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
    color: theme.palette.grey[600],
    textAlign: "center",
    ...({
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
    backgroundColor: "transparent"
  },
  openButton: {
},
  dropdownIcon: {
    verticalAlign: "middle",
    position: "relative"
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
    '& .MuiList-padding': {
      padding: '4px 0px',
    }
  },
  menuNoQueryParam: {
    // I have absolutely no idea what causes it but having queryParam undefined causes the
    // menu to be positioned 18px too high
    marginTop: 46
  },
  menuItem: {
    "&:focus": {
      outline: "none",
    },
  },
  iconLabel: {
    width: "16px !important",
  },
  optionIcon: {
    color: theme.palette.grey[600],
    marginRight: 12,
    width: "16px !important",
  },
}), {stylePriority: -2});

const ForumDropdownMultiselect = ({
  values,
  options,
  queryParam,
  onSelect,
  paddingSize = 10,
  useIconLabel,
  disabled,
  className,
}: {
  values: string[],
  options: Record<string, SettingsOption>,
  queryParam?: string,
  onSelect?: (value: string) => void,
  paddingSize?: number,
  useIconLabel?: boolean,
  disabled?: boolean,
  className?: string,
}) => {
  const classes = useStyles(styles);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const label = useIconLabel
    ? <ForumIcon icon={options[values[0]].icon!} className={classes.iconLabel} />
    : values.reduce((prev, next) => {
      const nextLabel = options[next].shortLabel || options[next].label
      if (!prev) return nextLabel
      return `${prev}, ${nextLabel}`
    }, '');

  const dropdownIcon = <ArrowDropDownIcon className={classes.dropdownIcon}/>
  return (
    <div className={classNames(classes.root, className)}>
      <Button
        variant="contained"
        onClick={(e) => {
          setAnchorEl(e.currentTarget)
        }}
        disabled={disabled}
        className={classNames(classes.button, { [classes.openButton]: Boolean(anchorEl) })}
      >
        {label} {dropdownIcon}
      </Button>
      <Menu open={Boolean(anchorEl)} anchorEl={anchorEl} onClose={() => setAnchorEl(null)} className={classNames(classes.menu, {[classes.menuNoQueryParam]: !queryParam})}>
        {Object.keys(options).map((option) => {
          const {icon, label} = options[option];
          const menuItem = <MenuItem
            key={option}
            value={option}
            onClick={() => {
              setAnchorEl(null);
              onSelect?.(option);
            }}
            className={classes.menuItem}
          >
            {icon && <ForumIcon icon={icon} className={classes.optionIcon} />}
            {label}
            {false}
          </MenuItem>

          if (queryParam) {
            return <QueryLink key={option} query={{ [queryParam]: option }} merge>
              {menuItem}
            </QueryLink>
          }
          return menuItem
        })}
      </Menu>
    </div>
  );
}

export default ForumDropdownMultiselect;


