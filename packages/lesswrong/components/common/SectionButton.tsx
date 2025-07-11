import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import classNames from 'classnames'
import { isFriendlyUI } from '../../themes/forumTheme';
import { isAF } from '@/lib/instanceSettings';
import { Typography } from "./Typography";

const styles = (theme: ThemeType) => ({
  root: {
    cursor: "pointer",
    color: theme.palette.lwTertiary.main,
    display: "flex",
    alignItems: "center",
    ...(isFriendlyUI ? {fontWeight: 600} : {}),
    '& svg': {
      marginRight: theme.spacing.unit
    },
    
    ...(isAF && {
      marginTop: 4,
      fontWeight: 500,
    }),
  }
})

const SectionButton = ({children, classes, className, onClick}: {
  children?: React.ReactNode,
  classes: ClassesType<typeof styles>,
  className?: string,
  onClick?: (event: React.MouseEvent) => void,
}) => {
  return <Typography
    component='span'
    variant='body2'
    className={classNames(classes.root, className)}
    onClick={onClick}
  >
    {children}
  </Typography>
}

export default registerComponent('SectionButton', SectionButton, {styles});


