import React, { type CSSProperties } from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import classNames from 'classnames';

const styles = defineStyles("MuiPaper", (theme: ThemeType) => {
  const elevations: Record<string,AnyBecauseHard> = {};
  theme.shadows.forEach((shadow, index) => {
    elevations[`elevation${index}`] = {
      boxShadow: shadow,
      
      ...(theme.themeOptions.name === "dark" && {
        boxShadow: "none",
      }),
    };
  });

  return {
    /* Styles applied to the root element. */
    root: {
      backgroundColor: theme.palette.background.paper,
    },
    rounded: {
      borderRadius: 4,
    },
    ...elevations,
  };
}, {stylePriority: -1})

/**
 * A card with a border and a drop shadow. Based on the material-UI <Paper>
 * component.
 */
export const Paper = ({elevation=2, square=false, className, style, children}: {
  elevation?: number,
  square?: boolean,
  className?: string,
  style?: CSSProperties,
  children?: React.ReactNode
}) => {
  const classes = useStyles(styles);
  return <div className={classNames(
    classes.root,
    !square && classes.rounded,
    (classes as any)[`elevation${elevation}`],
    className,
  )} style={style}>
    {children}
  </div>
}

const cardStyles = defineStyles("Card", (theme) => ({
  root: {
    overflow: "hidden",
  },
}));

/**
 * A simple wrapper around <Paper>, with a different default elevation. Based
 * on the material-UI <Card> component.
 */
export const Card = ({raised=false, className, style, children}: {
  raised?: boolean
  className?: string
  style?: CSSProperties,
  children?: React.ReactNode
}) => {
  const classes = useStyles(cardStyles);
  return <Paper
    elevation={raised ? 8 : 1}
    className={classNames(classes.root, className)}
    style={style}
  >
    {children}
  </Paper>
}
