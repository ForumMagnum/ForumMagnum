import React from 'react';
import classNames from 'classnames';
import KeyboardArrowLeft from '../internal/svg-icons/KeyboardArrowLeft';
import KeyboardArrowRight from '../internal/svg-icons/KeyboardArrowRight';
import ButtonBase from '../ButtonBase';
import { StandardProps } from '..';
import { ButtonBaseProps } from '../ButtonBase/ButtonBase';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';

export interface TabScrollButtonProps
  extends StandardProps<ButtonBaseProps, TabScrollButtonClassKey> {
  direction?: 'left' | 'right';
  visible?: boolean;
}

export type TabScrollButtonClassKey = 'root';

export const styles = defineStyles("MuiTabScrollButton", theme => ({
  /* Styles applied to the root element. */
  root: {
    color: 'inherit',
    flex: '0 0 56px',
  },
}), {stylePriority: -10});

/**
 * @ignore - internal component.
 */
function TabScrollButton(props: TabScrollButtonProps) {
  const { classes: classesOverrides, className: classNameProp, direction, onClick, visible, ...other } = props;
  const classes = useStyles(styles, classesOverrides);

  const className = classNames(classes.root, classNameProp);

  if (!visible) {
    return <div className={className} />;
  }

  return (
    <ButtonBase className={className} onClick={onClick} tabIndex={-1} {...other}>
      {direction === 'left' ? <KeyboardArrowLeft /> : <KeyboardArrowRight />}
    </ButtonBase>
  );
}

TabScrollButton.defaultProps = {
  visible: true,
};

export default TabScrollButton;
