import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import classNames from 'classnames';

const styles = (theme: ThemeType) => ({
  root: {
    fontSize: 24,
    fontWeight: 600,
    fontFamily: ['Palatino',
      '"Palatino Linotype"',
      '"Palatino LT STD"',
      '"Book Antiqua"',
      'Georgia',
      'serif'].join(','),
    position:"relative",
    top:2,
    width: 24,
    textAlign:"center"
  }
})

const OmegaIcon = ({classes, className}: {
  classes: ClassesType<typeof styles>,
  className?: string,
}) => {
  return <span className={classNames(classes.root, className)}>Ω</span>
}

const OmegaIconComponent = registerComponent('OmegaIcon', OmegaIcon, {styles});

declare global {
  interface ComponentTypes {
    OmegaIcon: typeof OmegaIconComponent
  }
}
