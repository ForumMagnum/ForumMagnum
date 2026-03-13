import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { defineStyles } from '@/components/hooks/defineStyles';

const styles = defineStyles("RevisionComparisonNotice", (theme: ThemeType) => ({
  root: {
  }
}));
const RevisionComparisonNotice = ({before, after, classes}: {
  before: string,
  after: string,
  classes: ClassesType<typeof styles>,
}) => {
  return <p className={classes.root}>You are comparing revision {before} to revision {after}.</p>
}

export default registerComponent("RevisionComparisonNotice", RevisionComparisonNotice, {styles});


