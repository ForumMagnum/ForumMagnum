import { registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import MetaInfo from "../common/MetaInfo";

const styles = (theme: ThemeType) => ({
  overflow: {
    color: theme.palette.text.red,
  }
})

const SunshineListCount = ({ count, classes }: {
  count: number|undefined,
  classes: ClassesType<typeof styles>,
}) => {
  if (count && count > 10) {
    return <MetaInfo className={count > 20 ? classes.overflow : undefined}>({count})</MetaInfo>
  } else {
    return null
  }
}

export default registerComponent('SunshineListCount', SunshineListCount, {styles});



