import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import classNames from 'classnames'
import { Typography } from "@/components/common/Typography";

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

const SectionSubtitle = ({children, classes, className}: {
  children?: React.ReactNode,
  classes: ClassesType<typeof styles>,
  className?: string,
}) => {
  return <Typography component='span' variant='subheading' className={classNames(classes.root, className)}>
    {children}
  </Typography>
}

const SectionSubtitleComponent = registerComponent('SectionSubtitle', SectionSubtitle, {styles})

declare global {
  interface ComponentTypes {
    SectionSubtitle: typeof SectionSubtitleComponent
  }
}

export default SectionSubtitleComponent;
