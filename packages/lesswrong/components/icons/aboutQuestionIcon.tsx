import React from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import classNames from 'classnames';

const styles = defineStyles('AboutQuestionIcon', (theme: ThemeType) => ({
  root: {
    filter: theme.palette.type === 'dark' ? 'brightness(10)' : 'none',
  },
}));

export const AboutQuestionIcon = ({ className }: {
  className?: string,
}) => {
  const classes = useStyles(styles);
  return <img
    src="/icons/question.png"
    alt=""
    className={classNames(classes.root, className)}
    width={24}
    height={24}
  />;
}

