import React from 'react';
import classNames from 'classnames';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';

export const styles = defineStyles("MuiSvgIcon", (theme: any) => ({
  root: {
    userSelect: 'none',
    width: '1em',
    height: '1em',
    display: 'inline-block',
    fill: 'currentColor',
    flexShrink: 0,
    fontSize: 24,
    transition: theme.transitions.create('fill', {
      duration: theme.transitions.duration.shorter,
    }),
  },
}), {stylePriority: -10});

function SvgIcon(props: {
  className?: string
  viewBox?: string
} & React.SVGProps<SVGSVGElement>) {
  const classes = useStyles(styles);
  const {
    className,
    viewBox='0 0 24 24',
    ...other
  } = props;

  return <svg
    className={classNames(
      classes.root,
      className,
    )}
    focusable="false"
    viewBox={viewBox}
    aria-hidden={'true'}
    role={'presentation'}
    {...other}
  />
}

export default SvgIcon;
