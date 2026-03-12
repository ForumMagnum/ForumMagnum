import React from 'react';
import classNames from 'classnames'
import { Typography } from "./Typography";
import { defineStyles } from '../hooks/defineStyles';
import { useStyles } from '../hooks/useStyles';

const styles = defineStyles("SectionSubtitle", (theme: ThemeType) => ({
  root: {
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
    fontSize: "1rem",
    color: theme.palette.lwTertiary.main,
    display: "inline-block",
    lineHeight: "1rem",
    marginBottom: 8
  }
}));

const SectionSubtitle = ({children, className}: {
  children?: React.ReactNode,
  className?: string,
}) => {
  const classes = useStyles(styles);
  return <Typography component='span' variant='subheading' className={classNames(classes.root, className)}>
    {children}
  </Typography>
}

export default SectionSubtitle;


