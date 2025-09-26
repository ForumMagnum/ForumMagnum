import React, { useContext } from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import classNames from 'classnames';

const styles = defineStyles("PetrovStoryComponents", (theme: ThemeType) => ({
  storySectionDivider: {
    marginTop: 200,
    marginBottom: 200,
    marginRight: 80,
    [theme.breakpoints.down('xs')]: {
      marginTop: 100,
      marginBottom: 100,
      marginRight: 0,
    },
    color: "#eeeeee",
    opacity: .5,
    width: 200,
    borderBottom: `1px solid #f5f5f5`,
  },
  withinSectionDivider: {
    marginLeft: "auto",
    marginRight: "auto !important",
  },
  storySectionDividerPage: {
    marginRight: 260,
    [theme.breakpoints.down('md')]: {
      marginRight: 130,
    },
    [theme.breakpoints.down('xs')]: {
      marginRight: 0,
    },
  },
}))

export const PetrovStoryVariant = React.createContext<"page"|"sidebar">("sidebar");

export const PetrovStoryDivider = ({isPrelude, withinSection}: {
  isPrelude?: boolean
  withinSection?: boolean
}) => {
  const classes = useStyles(styles);
  const variant = useContext(PetrovStoryVariant);
  
  if (withinSection) {
    return <div className={classNames(classes.storySectionDivider, classes.withinSectionDivider, {
      [classes.storySectionDividerPage]: variant==="page" || !isPrelude
    })}/>
  } else {
    return <div className={classNames(classes.storySectionDivider, {
      [classes.storySectionDividerPage]: variant==="page" || !isPrelude
    })}/>
  }
}


