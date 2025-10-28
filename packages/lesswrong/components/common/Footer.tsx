import React from 'react';
import { defineStyles } from '../hooks/defineStyles';
import { useStyles } from '../hooks/useStyles';

const styles = defineStyles("Footer", (theme: ThemeType) => ({
  root: {
    height: 165,
    "@media print": {
      height: 0,
    },
  }
}));

const Footer = () => {
  const classes = useStyles(styles);
  return <div className={classes.root}/>;
}

export default Footer;


