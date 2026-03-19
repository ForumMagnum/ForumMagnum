import React from 'react';
import MetaInfo from "../common/MetaInfo";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles('SunshineListCount', (theme: ThemeType) => ({
  overflow: {
    color: theme.palette.text.red,
  }
}))

const SunshineListCount = ({count}: {
  count: number|undefined,
}) => {
  const classes = useStyles(styles);

  if (count && count > 10) {
    return <MetaInfo className={count > 20 ? classes.overflow : undefined}>({count})</MetaInfo>
  } else {
    return null
  }
}

export default SunshineListCount;



