import React from 'react';
import KeyboardArrowUpIcon from '@/lib/vendor/@material-ui/icons/src/KeyboardArrowUp';
import classNames from 'classnames';
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles('KarmaIcon', (theme: ThemeType) => ({
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
}))

// this is currently unused, but will hopefully be used someday after we reflect on it a bit more.
const KarmaIcon = ({className}: {
  className?: string,
}) => {
  const classes = useStyles(styles);

  return <span className={classNames(classes.root, className)}>
      <KeyboardArrowUpIcon className={classes.bigArrow}/>
      <KeyboardArrowUpIcon className={classes.smallArrow}/>
    </span>
}

export default KarmaIcon;


