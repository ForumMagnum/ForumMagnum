import React from 'react';
import { useStyles } from '@/components/hooks/useStyles';
import { defineStyles } from '@/components/hooks/defineStyles';

const styles = defineStyles("ColoredNumber", (theme: ThemeType) => ({
  gainedPoints: {
    color: theme.palette.primary.main,
  },
  zeroPoints: {},
  lostPoints: {},
}));

// Given a number, return a span of it as a string, with a plus sign if it's
// positive, and green, red, or black coloring for positive, negative, and
// zero, respectively.

export const ColoredNumber = ({ n }: {
  n: number;
}) => {
  const classes = useStyles(styles);
  if (n > 0) {
    return <span className={classes.gainedPoints}>{`+${n}`}</span>;
  } else if (n === 0) {
    return <span className={classes.zeroPoints}>{n}</span>;
  } else {
    return <span className={classes.lostPoints}>{n}</span>;
  }
};
