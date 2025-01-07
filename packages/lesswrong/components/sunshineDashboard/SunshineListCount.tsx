import { Components, registerComponent } from '../../lib/vulcan-lib';
import React from 'react';

const styles = (theme: ThemeType) => ({
  overflow: {
    color: theme.palette.text.red,
  }
})

const SunshineListCount = ({ count, classes }: {
  count: number|undefined,
  classes: ClassesType<typeof styles>,
}) => {
  const { MetaInfo } = Components
  if (count && count > 10) {
    return <MetaInfo className={count > 20 ? classes.overflow : undefined}>({count})</MetaInfo>
  } else {
    return null
  }
}

const SunshineListCountComponent = registerComponent('SunshineListCount', SunshineListCount, {styles});

declare global {
  interface ComponentTypes {
    SunshineListCount: typeof SunshineListCountComponent
  }
}

