import React from 'react';
import classNames from 'classnames'
import { isAF } from '@/lib/instanceSettings';
import { Typography } from "./Typography";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles('SectionButton', (theme: ThemeType) => ({
  root: {
    cursor: "pointer",
    color: theme.palette.lwTertiary.main,
    display: "flex",
    alignItems: "center",
    ...(theme.isFriendlyUI ? {fontWeight: 600} : {}),
    '& svg': {
      marginRight: 8
    },
    
    ...(isAF() && {
      marginTop: 4,
      fontWeight: 500,
    }),
  }
}))

const SectionButton = ({children, className, onClick}: {
  children?: React.ReactNode,
  className?: string,
  onClick?: (event: React.MouseEvent) => void,
}) => {
  const classes = useStyles(styles);

  return <Typography
    component='span'
    variant='body2'
    className={classNames(classes.root, className)}
    onClick={onClick}
  >
    {children}
  </Typography>
}

export default SectionButton;


