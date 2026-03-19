import React from 'react';
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles("RevisionComparisonNotice", (theme: ThemeType) => ({
  root: {
  }
}));
const RevisionComparisonNotice = ({before, after}: {
  before: string,
  after: string,
}) => {
  const classes = useStyles(styles);

  return <p className={classes.root}>You are comparing revision {before} to revision {after}.</p>
}

export default RevisionComparisonNotice


