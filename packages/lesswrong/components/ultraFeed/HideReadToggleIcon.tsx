import React from 'react';
import classNames from 'classnames';
import { defineStyles, useStyles } from '../hooks/useStyles';
import ForumIcon from '../common/ForumIcon';
import LWTooltip from '../common/LWTooltip';

const styles = defineStyles('HideReadToggleIcon', (theme: ThemeType) => ({
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  containerHidden: {
    opacity: 0,
    visibility: 'hidden',
    pointerEvents: 'none',
  },
  iconButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
    height: 32,
    borderRadius: '50%',
    cursor: 'pointer',
    border: 'none',
    background: 'transparent',
    color: theme.palette.grey[600],
    transition: 'all 0.2s ease',
    padding: 0,
    '&:hover': {
      opacity: 0.8,
    },
  },
  icon: {
    fontSize: 20,
  },
}));

export type HideReadToggleIconProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  visible?: boolean;
  disabled?: boolean;
  className?: string;
};

const HideReadToggleIcon = ({
  checked,
  onChange,
  visible = true,
  disabled = false,
  className,
}: HideReadToggleIconProps) => {
  const classes = useStyles(styles);
  
  const tooltipTitle = checked ? "Currently hiding items that are fully read" : "Showing all items, including fully read";
  const iconName = checked ? "EyeSlash" : "Eye";
  
  return (
    <div className={classNames(classes.container, !visible && classes.containerHidden, className)}>
      <LWTooltip title={tooltipTitle} placement="bottom">
        <button
          className={classes.iconButton}
          onClick={() => onChange(!checked)}
          disabled={disabled || !visible}
          aria-label={tooltipTitle}
        >
          <ForumIcon icon={iconName} className={classes.icon} />
        </button>
      </LWTooltip>
    </div>
  );
};

export default HideReadToggleIcon;
