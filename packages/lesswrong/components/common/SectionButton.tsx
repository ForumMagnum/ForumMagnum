import React from 'react';
import classNames from 'classnames'
import { useForumType } from '@/components/hooks/useForumType';
import { Typography } from "./Typography";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles('SectionButton', (theme: ThemeType) => ({
  root: {
    cursor: "pointer",
    color: theme.palette.lwTertiary.main,
    display: "flex",
    alignItems: "center",
    '& svg': {
      marginRight: 8
    },
  },
  af: {
    marginTop: 4,
    fontWeight: 500,
  },
}))

const SectionButton = ({children, className, onClick}: {
  children?: React.ReactNode,
  className?: string,
  onClick?: (event: React.MouseEvent) => void,
}) => {
  const { isAF } = useForumType();
  const classes = useStyles(styles);

  return <Typography
    component='span'
    variant='body2'
    className={classNames(classes.root, { [classes.af]: isAF }, className)}
    onClick={onClick}
  >
    {children}
  </Typography>
}

export default SectionButton;


