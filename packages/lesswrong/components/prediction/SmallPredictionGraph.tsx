import React from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import max from 'lodash/max';
import { percentageToBucket } from '@/lib/utils/predictionUtil';

const styles = defineStyles("SmallPredictionGraph", (theme: ThemeType) => ({
  root: {
    width: 40,
    height: 10,
    padding: 1,
  },
  currentUserSvgBucket: {
    fill: theme.dark ? "#009f00" : "#22dd22",
  },
  emptySvgBucket: {
    fill: theme.dark ? "#888" : "#e8e8e8",
  },
  defaultSvgBucket: {
    fill: theme.dark ? "#888" : "#aca",
  },
}))


export const SmallPredictionGraph = ({currentUserPrediction, buckets}: {
  currentUserPrediction: number|null,
  buckets: number[]
}) => {
  const classes = useStyles(styles);
  const numBuckets = buckets.length;
  const largestBucket = max(buckets) ?? 0;
  const currentUserBucket = currentUserPrediction ? percentageToBucket(currentUserPrediction, buckets.length) : null;
  
  // We use an SVG, rather than a bunch of spans, because otherwise the
  // thickness of the gap between bars (which may be smaller than a pixel or
  // a small non-integer number of pixels) comes out inconsistent.
  //
  // In the internal coordinate system of the SVG, each vertical bar is
  // svgBucketWidth units thick and svgBucketSpacing units apart, and the full
  // height is 100 (so svg units are percentages). The actual display size is
  // then set with a CSS width and height.
  const svgBucketWidth = 4;
  const svgBucketSpacing = 1;
  const svgBucketStride = svgBucketWidth + svgBucketSpacing;
  const svgInternalWidth = (numBuckets*svgBucketWidth) + ((numBuckets-1)*svgBucketSpacing);

  const svgMinBucketHeight = 5;
  const svgBucketHeightScale = (100.0-svgMinBucketHeight) / largestBucket;
  
  return <svg viewBox={`0 0 ${svgInternalWidth} 100`} className={classes.root} preserveAspectRatio="none">
    {buckets.map((bucket,i) => <rect
      key={i}
      className={
        i === currentUserBucket
          ? classes.currentUserSvgBucket
          : (bucket===0
            ? classes.emptySvgBucket
            : classes.defaultSvgBucket)
      }
      x={i*svgBucketStride}
      width={svgBucketWidth}
      y={100 - (svgMinBucketHeight + (bucket*svgBucketHeightScale))}
      height={svgMinBucketHeight + bucket*svgBucketHeightScale}
    />)}
  </svg>
}

