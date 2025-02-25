import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';

const styles = (theme: ThemeType) => ({
  root: {
  }
});
const RevisionComparisonNotice = ({before, after, classes}: {
  before: string,
  after: string,
  classes: ClassesType<typeof styles>,
}) => {
  return <p className={classes.root}>You are comparing revision {before} to revision {after}.</p>
}

const RevisionComparisonNoticeComponent = registerComponent("RevisionComparisonNotice", RevisionComparisonNotice, {styles});

declare global {
  interface ComponentTypes {
    RevisionComparisonNotice: typeof RevisionComparisonNoticeComponent
  }
}
