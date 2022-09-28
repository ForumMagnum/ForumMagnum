import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    ...theme.typography.chapterTitle,
    margin: "1em 0",
  }
});

const ChapterTitle = ({classes, title}: {
  classes: ClassesType,
  title: string
}) => {
  return  <div className={classes.root}>{title}</div>
}

const ChapterTitleComponent = registerComponent("ChapterTitle", ChapterTitle, {styles});

declare global {
  interface ComponentTypes {
    ChapterTitle: typeof ChapterTitleComponent
  }
}