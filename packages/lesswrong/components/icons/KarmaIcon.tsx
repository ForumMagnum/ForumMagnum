import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import KeyboardArrowUpIcon from '@/lib/vendor/@material-ui/icons/src/KeyboardArrowUp';
import classNames from 'classnames';

const styles = (theme: ThemeType) => ({
  root: {
    position: "relative",
    width: "1em",
    height: "1em",
    display: "inline-block"
  },
  bigArrow: {
    position: "absolute",
    top: "-.285em",
    left: "-.255em",
    fontSize: "2em",
    color: "inherit"
  },
  smallArrow: {
    position: "absolute",
    top: "-.04em",
    left: "-.186em",
    color: "inherit",
    fontSize: "1.52em"
  }
})

// this is currently unused, but will hopefully be used someday after we reflect on it a bit more.
const KarmaIconInner = ({classes, className}: {
  classes: ClassesType<typeof styles>,
  className?: string,
}) => {
  return <span className={classNames(classes.root, className)}>
      <KeyboardArrowUpIcon className={classes.bigArrow}/>
      <KeyboardArrowUpIcon className={classes.smallArrow}/>
    </span>
}

export const KarmaIcon = registerComponent('KarmaIcon', KarmaIconInner, {styles});


