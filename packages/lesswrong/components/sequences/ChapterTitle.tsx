import classNames from 'classnames';
import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';

const styles = (theme: ThemeType) => ({
  root: {
    ...theme.typography.chapterTitle,
  },
  large: {
    ...theme.typography.largeChapterTitle,
  }
});

const ChapterTitleInner = ({classes, title, large}: {
  classes: ClassesType<typeof styles>,
  title: string,
  large?: boolean
}) => {
  return  <div className={classNames(classes.root, {[classes.large]:large})}>{title}</div>
}

export const ChapterTitle = registerComponent("ChapterTitle", ChapterTitleInner, {styles});


