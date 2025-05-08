import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';

const styles = (theme: ThemeType) => ({
  overflow: {
    color: theme.palette.text.red,
  }
})

const SunshineListCountInner = ({ count, classes }: {
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

export const SunshineListCount = registerComponent('SunshineListCount', SunshineListCountInner, {styles});

declare global {
  interface ComponentTypes {
    SunshineListCount: typeof SunshineListCount
  }
}

