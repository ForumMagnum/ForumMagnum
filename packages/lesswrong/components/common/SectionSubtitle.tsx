import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import classNames from 'classnames'

const styles = (theme: ThemeType) => ({
  root: {
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
    fontSize: "1rem",
    color: theme.palette.lwTertiary.main,
    display: "inline-block",
    lineHeight: "1rem",
    marginBottom: 8
  }
})

const SectionSubtitleInner = ({children, classes, className}: {
  children?: React.ReactNode,
  classes: ClassesType<typeof styles>,
  className?: string,
}) => {
  return <Components.Typography component='span' variant='subheading' className={classNames(classes.root, className)}>
    {children}
  </Components.Typography>
}

export const SectionSubtitle = registerComponent('SectionSubtitle', SectionSubtitleInner, {styles})

declare global {
  interface ComponentTypes {
    SectionSubtitle: typeof SectionSubtitle
  }
}
