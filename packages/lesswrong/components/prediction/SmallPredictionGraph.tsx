import React from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import max from 'lodash/max';
import { percentageToBucket } from '@/lib/utils/predictionUtil';
import classNames from 'classnames';

const styles = defineStyles("SmallPredictionGraph", (theme: ThemeType) => ({
  root: {
    //border: theme.palette.border.normal,
    //borderRadius: 2,
    width: 40,
    height: 10,
    padding: 1,
    display: "flex",
    alignItems: "end",
    gap: 0.5,
  },
  bucket: {
    flexGrow: 1,
    display: "inline-block",
    background: theme.dark ? "#888" : "#aca",
    boxSizing: "border-box",
  },
  emptyBucket: {
    background: theme.dark ? "#888" : "#e8e8e8",
  },
  currentUserBucket: {
    background: theme.dark ? "#009f00" : "#22dd22",
  },
}))

const minBarHeight = 3;

export const SmallPredictionGraph = ({currentUserPrediction, buckets}: {
  currentUserPrediction: number|null,
  buckets: number[]
}) => {
  const classes = useStyles(styles);
  const largestBucket = max(buckets) ?? 0;
  const heightScale = 100.0 / largestBucket;
  const currentUserBucket = currentUserPrediction ? percentageToBucket(currentUserPrediction, buckets.length) : null;

  return <div className={classes.root}>
    {buckets.map((bucket,i) => <span
      key={i}
      className={classNames(
        classes.bucket,
        bucket===0 && classes.emptyBucket,
        i === currentUserBucket && classes.currentUserBucket,
      )}
      style={{ height: `calc(${bucket * heightScale}% + ${minBarHeight}px)` }}
    />)}
  </div>
}

