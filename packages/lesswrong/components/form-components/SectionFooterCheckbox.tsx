import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import Checkbox from '@/lib/vendor/@material-ui/core/src/Checkbox';
import classNames from 'classnames';
import type { Placement as PopperPlacementType } from "popper.js"
import LWTooltip from "../common/LWTooltip";

const styles = (theme: ThemeType) => ({
  root: {
    cursor: "pointer",
    ...theme.typography.commentStyle,
    ...theme.typography.body2,
    display: "flex",
    alignItems: "center",
    [theme.breakpoints.down('xs')]: {
      flex: `1 0 100%`,
      order: 0
    }
  },
  checkbox: {
    color: theme.palette.lwTertiary.main,
    padding: "2px 8px 0 0",
    '& svg': {
      height: "1.3rem",
      width: "1.3rem",
      position: "relative"
    }
  },
  checked: {
    '&&': {
      color: theme.palette.lwTertiary.main,
    }
  },
  label: {
    ...theme.typography.commentStyle,
    color: theme.palette.lwTertiary.main
  },
  disabled: {
    cursor: "default",
    opacity: .5
  }
})

const SectionFooterCheckbox = ({ classes, label, onClick, value, disabled, tooltip, tooltipPlacement="bottom-start", labelClassName }: {
  classes: ClassesType<typeof styles>,
  label: string|React.ReactNode,
  onClick: (ev: React.MouseEvent) => void,
  value: boolean,
  disabled?: boolean,
  tooltip?: any,
  tooltipPlacement?: PopperPlacementType,
  labelClassName?: string
}) => {
  const checkbox = <span className={classNames(classes.root, {[classes.disabled]: disabled })} onClick={!disabled ? onClick : undefined}>
    <Checkbox disableRipple classes={{root: classes.checkbox, checked: classes.checked}} checked={value} />
    <span className={classNames(classes.label, labelClassName)}>{ label }</span>
  </span>

  if (tooltip) {
    return <LWTooltip title={tooltip} placement={tooltipPlacement}>
      {checkbox}
    </LWTooltip>
  } else {
    return checkbox
  }
}

export default registerComponent("SectionFooterCheckbox", SectionFooterCheckbox, {styles});


