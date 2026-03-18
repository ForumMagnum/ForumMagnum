import classNames from 'classnames';
import React from 'react';
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles("ChapterTitle", (theme: ThemeType) => ({
  root: {
    ...theme.typography.chapterTitle,
  },
  large: {
    ...theme.typography.largeChapterTitle,
  }
}));

const ChapterTitle = ({title, large}: {
  title: string,
  large?: boolean
}) => {
  const classes = useStyles(styles);

  return  <div className={classNames(classes.root, {[classes.large]:large})}>{title}</div>
}

export default ChapterTitle;


