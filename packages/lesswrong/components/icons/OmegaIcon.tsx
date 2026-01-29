import React from 'react';
import classNames from 'classnames';
import { defineStyles } from '../hooks/defineStyles';
import { useStyles } from '../hooks/useStyles';

const styles = defineStyles("OmegaIcon", (theme: ThemeType) => ({
  root: {
    fontSize: 24,
    fontWeight: 600,
    fontFamily: ['Palatino',
      '"Palatino Linotype"',
      '"Palatino LT STD"',
      '"Book Antiqua"',
      'Georgia',
      'serif'].join(','),
    position:"relative",
    top:2,
    width: 24,
    textAlign:"center"
  }
}))

const OmegaIcon = ({className}: {
  className?: string,
}) => {
  const classes = useStyles(styles);
  return <span className={classNames(classes.root, className)}>Ω</span>
}

export default OmegaIcon;


