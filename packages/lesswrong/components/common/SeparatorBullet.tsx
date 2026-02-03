import React from 'react';
import { defineStyles } from '../hooks/defineStyles';
import { useStyles } from '../hooks/useStyles';

const styles = defineStyles("SeparatorBullet", (theme: ThemeType) => ({
  root: {
    marginLeft: 10,
    marginRight: 10,
    color: theme.palette.primary.main
  }
}))

const SeparatorBullet = () => {
  const classes = useStyles(styles);
  return <span className={classes.root}>{" "}•{" "}</span>;
}

export default SeparatorBullet;


