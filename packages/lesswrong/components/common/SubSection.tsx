import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import classNames from 'classnames'
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles('SubSection', (theme: ThemeType) => ({
  root: {
    marginLeft: 20
  }
}))

const SubSection = ({children, className}: {
  children?: React.ReactNode,
  className?: string,
}) => {
  const classes = useStyles(styles);

  return <div className={classNames(classes.root, className)}>
    {children}
  </div>
}

export default SubSection;


